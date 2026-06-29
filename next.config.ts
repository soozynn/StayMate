import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    staleTimes: {
      dynamic: 0,  // 동적 페이지: 클라이언트 캐시 없음
      static: 0,   // ISR 페이지: 항상 서버에서 확인 — 업데이트 있으면 즉시 반영
    },
  },
};

export default nextConfig;
