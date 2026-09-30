import type { Instrumentation } from "next";

// 서버 컴포넌트 렌더링, 라우트 핸들러, 서버 액션, 미들웨어에서 처리되지 않은 에러를
// Next.js가 이 훅으로 전달해 줌 → Discord로 알림
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const { reportError } = await import("@/lib/monitoring/discord");

  await reportError(error, {
    source: context.routeType,
    method: request.method,
    path: request.path,
    extra: {
      라우트: context.routePath,
      digest:
        error && typeof error === "object" && "digest" in error
          ? String(error.digest)
          : undefined,
    },
  });
};
