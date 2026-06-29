import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ReservationCompletePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-[--color-foreground]">
        예약 신청 완료!
      </h1>
      <p className="mb-8 text-sm leading-relaxed text-[--color-muted-foreground]">
        예약 신청이 접수되었습니다.
        <br />
        관리자 승인 후 이메일로 결과를 안내해 드립니다.
        <br />
        승인까지 잠시 기다려 주세요.
      </p>

      <div className="w-full max-w-xs space-y-2">
        <Button asChild fullWidth size="lg">
          <Link href="/">홈으로 돌아가기</Link>
        </Button>
        <Button asChild variant="outline" fullWidth>
          <Link href="/calendar">예약 현황 보기</Link>
        </Button>
      </div>
    </div>
  );
}
