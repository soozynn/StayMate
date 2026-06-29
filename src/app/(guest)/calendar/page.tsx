"use client";

import { addMonths, format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useState } from "react";
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

  function isDayPending(date: Date) {
    return blockedRanges
      .filter((r) => r.status === "pending")
      .some((r) => date >= parseISO(r.checkIn) && date < parseISO(r.checkOut));
  }

  function isDayApproved(date: Date) {
    return blockedRanges
      .filter((r) => r.status === "approved")
      .some((r) => date >= parseISO(r.checkIn) && date < parseISO(r.checkOut));
  }

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
              modifiers={{ pending: isDayPending, approved: isDayApproved }}
              modifiersClassNames={{
                pending: "cal-pending",
                approved: "cal-approved",
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
                day: "flex-1 flex items-center justify-center",
                day_button: "h-9 w-9 rounded-full text-sm cursor-default",
                today: "font-bold",
                outside: "opacity-30",
              }}
            />

            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-amber-200" />
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
                        {format(parseISO(range.checkIn), "MM.dd")} –{" "}
                        {format(parseISO(range.checkOut), "MM.dd")}
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
        .cal-pending .rdp-day_button { background-color: #fde68a; color: #78350f; border-radius: 9999px; }
        .cal-approved .rdp-day_button { background-color: #cbd5e1; color: #334155; border-radius: 9999px; }
      `}</style>
    </>
  );
}
