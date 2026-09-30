// Discord 웹훅으로 에러/장애 알림을 보내는 모듈
// DISCORD_WEBHOOK_URL이 없으면 아무것도 하지 않음 (로컬 개발 기본값)
// Node / Edge 런타임 모두에서 동작하도록 fetch만 사용

type AlertLevel = "error" | "warning";

export type ErrorReportContext = {
  // 에러가 발생한 위치 (예: "api-route", "render", "client", "email")
  source: string;
  level?: AlertLevel;
  method?: string;
  path?: string;
  extra?: Record<string, unknown>;
};

const COLORS: Record<AlertLevel, number> = {
  error: 0xef4444,
  warning: 0xf59e0b,
};

// 같은 에러가 연달아 터질 때 채널이 도배되지 않도록 일정 시간 동안 중복 알림을 막음
const DEDUPE_WINDOW_MS = 60_000;
const recentAlerts = new Map<string, number>();

const SEND_TIMEOUT_MS = 3_000;

function normalizeError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }

  if (typeof error === "string") {
    return { name: "Error", message: error };
  }

  try {
    return { name: "NonErrorThrown", message: JSON.stringify(error) };
  } catch {
    return { name: "NonErrorThrown", message: String(error) };
  }
}

// DB 연결 문자열 등에 포함된 계정 정보가 알림에 노출되지 않도록 가림
function redact(text: string): string {
  return text.replace(/(mongodb(?:\+srv)?:\/\/)[^@\s/]+@/g, "$1***@");
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function isDuplicate(fingerprint: string): boolean {
  const now = Date.now();

  for (const [key, sentAt] of recentAlerts) {
    if (now - sentAt > DEDUPE_WINDOW_MS) recentAlerts.delete(key);
  }

  if (recentAlerts.has(fingerprint)) return true;

  recentAlerts.set(fingerprint, now);
  return false;
}

function getEnvironmentLabel(): string {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";
}

export async function reportError(
  error: unknown,
  context: ErrorReportContext,
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const { name, message, stack } = normalizeError(error);
    const level = context.level ?? "error";

    const fingerprint = `${context.source}|${context.path ?? ""}|${name}|${message}`;
    if (isDuplicate(fingerprint)) return;

    const fields = [
      { name: "환경", value: getEnvironmentLabel(), inline: true },
      { name: "발생 위치", value: context.source, inline: true },
    ];

    if (context.path) {
      fields.push({
        name: "요청",
        value: truncate(`${context.method ?? ""} ${context.path}`.trim(), 1000),
        inline: false,
      });
    }

    for (const [key, value] of Object.entries(context.extra ?? {})) {
      if (value === undefined || value === null || value === "") continue;
      fields.push({
        name: key,
        value: truncate(redact(String(value)), 1000),
        inline: true,
      });
    }

    const description = stack
      ? `\`\`\`\n${truncate(redact(stack), 3500)}\n\`\`\``
      : undefined;

    const payload = {
      username: "StayMate 알림",
      embeds: [
        {
          title: truncate(
            `${level === "error" ? "🚨" : "⚠️"} ${name}: ${redact(message)}`,
            256,
          ),
          description,
          color: COLORS[level],
          fields: fields.slice(0, 25),
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(
        `[Monitoring] Discord 알림 전송 실패: ${response.status} ${response.statusText}`,
      );
    }
  } catch (sendError) {
    // 알림 전송 실패가 원래 요청 처리에 영향을 주면 안 되므로 로그만 남김
    console.error("[Monitoring] Discord 알림 전송 중 오류:", sendError);
  }
}
