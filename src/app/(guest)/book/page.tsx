"use client";

import { addMonths, format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";

import { DateRangePicker } from "@/components/booking/date-range-picker";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

type BlockedRange = {
  id: string;
  checkIn: string;
  checkOut: string;
  status: "pending" | "approved";
};

export default function BookPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guestCount, setGuestCount] = useState(1);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const from = new Date();
    const to = addMonths(from, 3);

    fetch(
      `/api/reservations/availability?from=${from.toISOString()}&to=${to.toISOString()}`,
    )
      .then((res) => res.json())
      .then((data) => setBlockedRanges(data.blockedRanges ?? []))
      .catch(() => setFetchError("예약 현황을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

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
          <p className="mb-3 text-sm font-medium text-slate-900">
            체크인 / 체크아웃
          </p>
          {fetchError && (
            <p className="mb-2 text-xs text-red-500">{fetchError}</p>
          )}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            </div>
          ) : (
            <DateRangePicker
              blockedRanges={blockedRanges}
              value={dateRange}
              onChange={setDateRange}
            />
          )}
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
