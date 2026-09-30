"use client";

import { useEffect } from "react";

const ENDPOINT = "/api/monitoring/client-error";

// 브라우저에서 잡히지 않은 에러/Promise rejection을 서버로 보내 Discord 알림으로 연결
function sendClientError(error: unknown) {
  const normalized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { name: "Error", message: String(error) };

  const body = JSON.stringify({ ...normalized, url: window.location.href });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
      return;
    }

    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // 에러 리포팅 실패는 무시
  }
}

export function ClientErrorReporter() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      sendClientError(event.error ?? event.message);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      sendClientError(event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
