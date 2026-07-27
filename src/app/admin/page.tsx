import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getDashboardSnapshot } from "@/lib/services/reservation.service";

export default async function AdminDashboardPage() {
  const { pendingCount, approvedThisMonthCount, checkingInToday, checkingOutToday } =
    await getDashboardSnapshot();
  const today = new Date();

  return (
    <>
      <PageHeader subtitle="관리자" title="대시보드" />

      <div className="space-y-5 px-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 px-4 py-4">
            <p className="text-xs text-slate-400">대기 중</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{pendingCount}건</p>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-4">
            <p className="text-xs text-slate-400">{format(today, "M월")} 확정 예약</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{approvedThisMonthCount}건</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-900">
            오늘 체크인 ({format(today, "M월 d일 (EEE)", { locale: ko })})
          </p>
          {checkingInToday.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-400">예정된 체크인이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {checkingInToday.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-900">{r.guestName}</span>
                  <span className="text-xs text-slate-400">{r.guestCount}인</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-900">오늘 체크아웃</p>
          {checkingOutToday.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-400">예정된 체크아웃이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {checkingOutToday.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-900">{r.guestName}</span>
                  <span className="text-xs text-slate-400">{r.guestCount}인</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <Button asChild fullWidth variant="outline">
            <Link href="/admin/reservations">예약 목록 보기</Link>
          </Button>
          <Button asChild fullWidth variant="outline">
            <Link href="/admin/blocked-dates">날짜 차단 관리</Link>
          </Button>
          <Button asChild fullWidth>
            <Link href="/admin/reservations/new">예약 수동 등록</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
