"use client";

import { addDays, addMonths, format, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useMemo, useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/badge";

type BlockedRange = {
  id: string;
  checkIn: string;
  checkOut: string;
  status: "pending" | "approved";
};

type ParsedRange = {
  checkIn: Date;
  checkOut: Date;
  status: "pending" | "approved";
};

function inRange(date: Date, ranges: ParsedRange[]) {
  return ranges.some((r) => date >= r.checkIn && date < r.checkOut);
}

function isStart(date: Date, ranges: ParsedRange[]) {
  return ranges.some((r) => date.getTime() === r.checkIn.getTime());
}

function isEnd(date: Date, ranges: ParsedRange[]) {
  return ranges.some(
    (r) => date.getTime() === addDays(r.checkOut, -1).getTime(),
  );
}

export default function CalendarPage() {
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = new Date();
    const to = addMonths(from, 6);

    fetch(
      `/api/reservations/availability?from=${from.toISOString()}&to=${to.toISOString()}`,
    )
      .then((res) => res.json())
      .then((data) => setBlockedRanges(data.blockedRanges ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const parsed = useMemo<ParsedRange[]>(
    () =>
      blockedRanges.map((r) => ({
        checkIn: startOfDay(new Date(r.checkIn)),
        checkOut: startOfDay(new Date(r.checkOut)),
        status: r.status,
      })),
    [blockedRanges],
  );

  const pending = useMemo(() => parsed.filter((r) => r.status === "pending"), [parsed]);
  const approved = useMemo(() => parsed.filter((r) => r.status === "approved"), [parsed]);

  const modifiers = useMemo(
    () => ({
      pendingStart: (d: Date) => { const day = startOfDay(d); return isStart(day, pending) && !isEnd(day, pending); },
      pendingEnd: (d: Date) => { const day = startOfDay(d); return isEnd(day, pending) && !isStart(day, pending); },
      pendingSingle: (d: Date) => { const day = startOfDay(d); return isStart(day, pending) && isEnd(day, pending); },
      pendingMiddle: (d: Date) => { const day = startOfDay(d); return inRange(day, pending) && !isStart(day, pending) && !isEnd(day, pending); },
      approvedStart: (d: Date) => { const day = startOfDay(d); return isStart(day, approved) && !isEnd(day, approved); },
      approvedEnd: (d: Date) => { const day = startOfDay(d); return isEnd(day, approved) && !isStart(day, approved); },
      approvedSingle: (d: Date) => { const day = startOfDay(d); return isStart(day, approved) && isEnd(day, approved); },
      approvedMiddle: (d: Date) => { const day = startOfDay(d); return inRange(day, approved) && !isStart(day, approved) && !isEnd(day, approved); },
    }),
    [pending, approved],
  );

  return (
    <>
      <PageHeader subtitle="예약 현황" title="예약된 날짜 확인" />

      <div className="px-5">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          </div>
        ) : (
          <>
            <DayPicker
              mode="multiple"
              locale={ko}
              numberOfMonths={2}
              modifiers={modifiers}
              modifiersClassNames={{
                pendingStart: "cal-pending-start",
                pendingEnd: "cal-pending-end",
                pendingSingle: "cal-pending-single",
                pendingMiddle: "cal-pending-middle",
                approvedStart: "cal-approved-start",
                approvedEnd: "cal-approved-end",
                approvedSingle: "cal-approved-single",
                approvedMiddle: "cal-approved-middle",
              }}
              classNames={{
                root: "w-full",
                months: "flex flex-col gap-6 w-full",
                month: "w-full",
                month_grid: "w-full",
                month_caption: "flex items-center justify-between px-2 py-2",
                caption_label: "text-sm font-semibold text-slate-900",
                nav: "flex items-center gap-1",
                button_previous:
                  "h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100",
                button_next:
                  "h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100",
                weekdays: "flex",
                weekday:
                  "flex-1 text-center text-xs font-medium text-slate-400 py-2",
                week: "flex mt-1",
                day: "flex-1 flex items-center justify-center p-0",
                day_button: "h-9 w-9 rounded-full text-sm cursor-default",
                today: "font-bold",
                outside: "opacity-30",
              }}
            />

            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-amber-300" />
                승인 대기
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-slate-300" />
                예약 확정
              </span>
            </div>

            {blockedRanges.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">
                  예약 목록
                </h2>
                <div className="space-y-2">
                  {blockedRanges.map((range) => (
                    <div
                      key={range.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <p className="text-sm font-medium text-slate-900">
                        {format(new Date(range.checkIn), "MM.dd")} –{" "}
                        {format(new Date(range.checkOut), "MM.dd")}
                      </p>
                      <StatusBadge status={range.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {blockedRanges.length === 0 && (
              <p className="mt-6 text-center text-sm text-slate-400">
                현재 예약된 날짜가 없습니다.
              </p>
            )}
          </>
        )}
      </div>

      <style>{`
        /* pending — 시작 */
        .cal-pending-start { background: linear-gradient(to right, transparent 50%, #fde68a 50%); }
        .cal-pending-start button { background-color: #f59e0b !important; color: #78350f !important; border-radius: 9999px; }

        /* pending — 중간 */
        .cal-pending-middle { background-color: #fde68a; }
        .cal-pending-middle button { background-color: transparent !important; color: #92400e !important; border-radius: 0; width: 100%; }

        /* pending — 끝 */
        .cal-pending-end { background: linear-gradient(to left, transparent 50%, #fde68a 50%); }
        .cal-pending-end button { background-color: #f59e0b !important; color: #78350f !important; border-radius: 9999px; }

        /* pending — 1박 (시작=끝) */
        .cal-pending-single button { background-color: #f59e0b !important; color: #78350f !important; border-radius: 9999px; }

        /* approved — 시작 */
        .cal-approved-start { background: linear-gradient(to right, transparent 50%, #cbd5e1 50%); }
        .cal-approved-start button { background-color: #94a3b8 !important; color: #fff !important; border-radius: 9999px; }

        /* approved — 중간 */
        .cal-approved-middle { background-color: #cbd5e1; }
        .cal-approved-middle button { background-color: transparent !important; color: #334155 !important; border-radius: 0; width: 100%; }

        /* approved — 끝 */
        .cal-approved-end { background: linear-gradient(to left, transparent 50%, #cbd5e1 50%); }
        .cal-approved-end button { background-color: #94a3b8 !important; color: #fff !important; border-radius: 9999px; }

        /* approved — 1박 (시작=끝) */
        .cal-approved-single button { background-color: #94a3b8 !important; color: #fff !important; border-radius: 9999px; }
      `}</style>
    </>
  );
}
