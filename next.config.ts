import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    staleTimes: {
      dynamic: 0,  // 동적 페이지: 라우터 캐시 없음 — 항상 서버에서 최신 데이터
      static: 60,  // ISR 페이지: 60초 (revalidatePath 호출 시 즉시 무효화)
    },
  },
};

export default nextConfig;
