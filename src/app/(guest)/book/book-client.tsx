"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { DateRangePicker } from "@/components/booking/date-range-picker";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { BlockedRange } from "@/lib/services/availability.service";

export function BookClient({ blockedRanges }: { blockedRanges: BlockedRange[] }) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guestCount, setGuestCount] = useState(1);

  const canProceed = Boolean(
    dateRange?.from && dateRange?.to && dateRange.from < dateRange.to,
  );

  function handleProceed() {
    if (!dateRange?.from || !dateRange?.to) return;
    const params = new URLSearchParams({
      checkIn: dateRange.from.toISOString(),
      checkOut: dateRange.to.toISOString(),
      guestCount: String(guestCount),
    });
    router.push(`/book/confirm?${params.toString()}`);
  }

  return (
    <>
      <PageHeader subtitle="예약하기" title="날짜 및 인원 선택" />

      <div className="space-y-6 px-5">
        <div>
          <p className="mb-3 text-sm font-medium text-slate-900">
            인원 (최대 3명)
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
              disabled={guestCount <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg disabled:opacity-40"
            >
              −
            </button>
            <span className="w-6 text-center text-lg font-semibold">
              {guestCount}
            </span>
            <button
              type="button"
              onClick={() => setGuestCount((c) => Math.min(3, c + 1))}
              disabled={guestCount >= 3}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-slate-900">
            체크인 / 체크아웃
          </p>
          <p className="mb-3 text-xs text-slate-400">
            달력에서 체크인 날짜를 먼저 선택한 후, 체크아웃 날짜를 선택해주세요.
          </p>
          {!dateRange?.from && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <p className="text-xs font-medium text-indigo-600">
                체크인 날짜를 먼저 선택해주세요
              </p>
            </div>
          )}
          {dateRange?.from && !dateRange?.to && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-xs font-medium text-emerald-600">
                체크인 날짜가 선택됐어요. 이제 체크아웃 날짜를 선택해주세요.
              </p>
            </div>
          )}
          <DateRangePicker
            blockedRanges={blockedRanges}
            value={dateRange}
            onChange={setDateRange}
          />
        </div>

        {canProceed && dateRange?.from && dateRange?.to && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">체크인</span>
              <span className="font-medium">{format(dateRange.from, "yyyy.MM.dd")}</span>
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-slate-500">체크아웃</span>
              <span className="font-medium">{format(dateRange.to, "yyyy.MM.dd")}</span>
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-slate-500">인원</span>
              <span className="font-medium">{guestCount}명</span>
            </div>
          </div>
        )}

        <Button fullWidth size="lg" disabled={!canProceed} onClick={handleProceed}>
          다음 단계로
        </Button>
      </div>
    </>
  );
}
