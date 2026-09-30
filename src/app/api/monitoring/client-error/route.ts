import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { reportError } from "@/lib/monitoring/discord";

// 브라우저에서 발생한 에러를 받아 Discord로 전달
const clientErrorSchema = z.object({
  name: z.string().max(200).default("Error"),
  message: z.string().max(2000),
  stack: z.string().max(8000).optional(),
  url: z.string().max(2000),
});

// 공개 엔드포인트라 인스턴스당 분당 전송 횟수를 제한해 알림 폭주를 막음
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
let windowStartedAt = 0;
let windowCount = 0;

function isRateLimited(): boolean {
  const now = Date.now();

  if (now - windowStartedAt > RATE_LIMIT_WINDOW_MS) {
    windowStartedAt = now;
    windowCount = 0;
  }

  windowCount += 1;
  return windowCount > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  if (isRateLimited()) {
    return new NextResponse(null, { status: 429 });
  }

  const parsed = clientErrorSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return new NextResponse(null, { status: 400 });
  }

  const { name, message, stack, url } = parsed.data;
  const error = Object.assign(new Error(message), { name, stack });
  const path = (() => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  })();

  await reportError(error, {
    source: "client",
    path,
    extra: { 브라우저: request.headers.get("user-agent") ?? undefined },
  });

  return new NextResponse(null, { status: 204 });
}
