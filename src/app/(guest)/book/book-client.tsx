"use client";

import { addMonths, format, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";

import { DateRangePicker } from "@/components/booking/date-range-picker";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { BlockedRange } from "@/lib/services/availability.service";

async function fetchBlockedRanges(from: Date, to: Date): Promise<BlockedRange[]> {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const res = await fetch(`/api/reservations/availability?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.blockedRanges;
}

export function BookClient() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guestCount, setGuestCount] = useState(1);

  const from = useMemo(() => startOfDay(new Date()), []);
  const to = useMemo(() => addMonths(from, 3), [from]);

  const { data: blockedRanges = [] } = useQuery({
    queryKey: ["blockedRanges", format(from, "yyyy-MM-dd")],
    queryFn: () => fetchBlockedRanges(from, to),
    staleTime: 60 * 1000,
  });

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
            날짜 선택
          </p>

          {/* 날짜 선택 박스 (내 예약 스타일 통일) */}
          <div className="mb-3 flex items-center gap-2">
            <div
              className={`flex-1 rounded-xl px-3 py-2.5 ${
                dateRange?.from
                  ? "bg-slate-50"
                  : "border border-indigo-300 bg-slate-50"
              }`}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                    dateRange?.from ? "bg-emerald-500 text-white" : "bg-indigo-500 text-white"
                  }`}
                >
                  {dateRange?.from ? "✓" : "1"}
                </div>
                <span
                  className={`text-[10px] ${
                    dateRange?.from ? "text-emerald-600" : "text-indigo-500"
                  }`}
                >
                  체크인
                </span>
              </div>
              <p
                className={`text-sm font-medium ${
                  dateRange?.from ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {dateRange?.from
                  ? format(dateRange.from, "M월 d일 (EEE)", { locale: ko })
                  : "날짜를 선택해주세요"}
              </p>
            </div>

            <span className="text-sm text-slate-300">→</span>

            <div
              className={`flex-1 rounded-xl px-3 py-2.5 ${
                dateRange?.from && !dateRange?.to
                  ? "border border-indigo-300 bg-slate-50"
                  : "bg-slate-50"
              } ${!dateRange?.from ? "opacity-50" : ""}`}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                    dateRange?.to
                      ? "bg-emerald-500 text-white"
                      : dateRange?.from
                        ? "bg-indigo-500 text-white"
                        : "border border-slate-200 bg-slate-100 text-slate-400"
                  }`}
                >
                  {dateRange?.to ? "✓" : "2"}
                </div>
                <span
                  className={`text-[10px] ${
                    dateRange?.to
                      ? "text-emerald-600"
                      : dateRange?.from
                        ? "text-indigo-500"
                        : "text-slate-400"
                  }`}
                >
                  체크아웃
                </span>
              </div>
              <p
                className={`text-sm font-medium ${
                  dateRange?.to ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {dateRange?.to
                  ? format(dateRange.to, "M월 d일 (EEE)", { locale: ko })
                  : "—"}
              </p>
            </div>
          </div>

          <DateRangePicker
            blockedRanges={blockedRanges}
            value={dateRange}
            onChange={setDateRange}
          />
        </div>

        {canProceed && dateRange?.from && dateRange?.to && (
          <p className="text-center text-xs text-slate-400">
            {Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))}박 · {guestCount}인
          </p>
        )}

        <Button fullWidth size="lg" disabled={!canProceed} onClick={handleProceed}>
          다음 단계로
        </Button>
      </div>
    </>
  );
}
