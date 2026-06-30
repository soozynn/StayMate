"use client";

import { addDays, format, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useMemo } from "react";
import { DayPicker, useDayPicker, type MonthCaptionProps } from "react-day-picker";
import "react-day-picker/style.css";

import { StatusBadge } from "@/components/ui/badge";

function CalendarMonthCaption({ calendarMonth }: MonthCaptionProps) {
  const { goToMonth, previousMonth, nextMonth } = useDayPicker();
  return (
    <div className="flex items-center justify-between px-2 py-2">
      <button
        type="button"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30"
      >
        ‹
      </button>
      <span className="text-sm font-semibold text-slate-900">
        {format(calendarMonth.date, "yyyy년 M월", { locale: ko })}
      </span>
      <button
        type="button"
        disabled={!nextMonth}
        onClick={() => nextMonth && goToMonth(nextMonth)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30"
      >
        ›
      </button>
    </div>
  );
}

type BlockedRange = {
  id: string;
  checkIn: string;
  checkOut: string;
  status: "pending" | "approved";
  guestName: string;
};

type ParsedRange = {
  checkIn: Date;
  checkOut: Date;
  status: "pending" | "approved";
};

function maskName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

function getNights(checkIn: string, checkOut: string): number {
  return Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function inRange(date: Date, ranges: ParsedRange[]) {
  return ranges.some((r) => date >= r.checkIn && date < r.checkOut);
}

function isStart(date: Date, ranges: ParsedRange[]) {
  return ranges.some((r) => date.getTime() === r.checkIn.getTime());
}

function isEnd(date: Date, ranges: ParsedRange[]) {
  return ranges.some((r) => date.getTime() === addDays(r.checkOut, -1).getTime());
}

export function CalendarView({ blockedRanges }: { blockedRanges: BlockedRange[] }) {
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
      pendingStart:   (d: Date) => { const day = startOfDay(d); return isStart(day, pending) && !isEnd(day, pending); },
      pendingEnd:     (d: Date) => { const day = startOfDay(d); return isEnd(day, pending) && !isStart(day, pending); },
      pendingSingle:  (d: Date) => { const day = startOfDay(d); return isStart(day, pending) && isEnd(day, pending); },
      pendingMiddle:  (d: Date) => { const day = startOfDay(d); return inRange(day, pending) && !isStart(day, pending) && !isEnd(day, pending); },
      approvedStart:  (d: Date) => { const day = startOfDay(d); return isStart(day, approved) && !isEnd(day, approved); },
      approvedEnd:    (d: Date) => { const day = startOfDay(d); return isEnd(day, approved) && !isStart(day, approved); },
      approvedSingle: (d: Date) => { const day = startOfDay(d); return isStart(day, approved) && isEnd(day, approved); },
      approvedMiddle: (d: Date) => { const day = startOfDay(d); return inRange(day, approved) && !isStart(day, approved) && !isEnd(day, approved); },
    }),
    [pending, approved],
  );

  return (
    <div className="px-5">
      {/* 안내 문구 */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
        <p className="text-xs text-slate-400">오늘부터 6개월 이내의 예약 현황을 보여드립니다.</p>
      </div>

      {/* 범례 */}
      <div className="mb-3 flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          승인 대기
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          예약 확정
        </span>
      </div>

      {/* 달력 */}
      <DayPicker
        mode="multiple"
        locale={ko}
        numberOfMonths={1}
        modifiers={modifiers}
        modifiersClassNames={{
          pendingStart:   "cal-pending-start",
          pendingEnd:     "cal-pending-end",
          pendingSingle:  "cal-pending-single",
          pendingMiddle:  "cal-pending-middle",
          approvedStart:  "cal-approved-start",
          approvedEnd:    "cal-approved-end",
          approvedSingle: "cal-approved-single",
          approvedMiddle: "cal-approved-middle",
        }}
        hideNavigation
        components={{ MonthCaption: CalendarMonthCaption }}
        classNames={{
          root: "w-full",
          months: "w-full",
          month: "w-full",
          month_grid: "w-full",
          weekdays: "flex",
          weekday: "flex-1 text-center text-xs font-medium text-slate-400 py-2",
          week: "flex mt-1",
          day: "flex-1 flex items-center justify-center p-0",
          day_button: "h-9 w-9 rounded-full text-sm cursor-default",
          today: "font-bold",
          outside: "opacity-30",
        }}
      />

      {/* 예약 목록 */}
      {blockedRanges.length > 0 && (
        <div className="mt-2">
          <hr className="mb-4 border-slate-100" />
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            예약 목록
          </h2>
          <div className="space-y-3">
            {blockedRanges.map((range) => (
              <ReservationListCard key={range.id} range={range} />
            ))}
          </div>
        </div>
      )}

      {blockedRanges.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-400">현재 예약된 날짜가 없습니다.</p>
      )}

      <style>{`
        .cal-pending-start { background: linear-gradient(to right, transparent 50%, #fde68a 50%); }
        .cal-pending-start button { background-color: #f59e0b !important; color: #78350f !important; border-radius: 9999px; }
        .cal-pending-middle { background-color: #fde68a; }
        .cal-pending-middle button { background-color: transparent !important; color: #92400e !important; border-radius: 0; width: 100%; }
        .cal-pending-end { background: linear-gradient(to left, transparent 50%, #fde68a 50%); }
        .cal-pending-end button { background-color: #f59e0b !important; color: #78350f !important; border-radius: 9999px; }
        .cal-pending-single button { background-color: #f59e0b !important; color: #78350f !important; border-radius: 9999px; }
        .cal-approved-start { background: linear-gradient(to right, transparent 50%, #cbd5e1 50%); }
        .cal-approved-start button { background-color: #94a3b8 !important; color: #fff !important; border-radius: 9999px; }
        .cal-approved-middle { background-color: #cbd5e1; }
        .cal-approved-middle button { background-color: transparent !important; color: #334155 !important; border-radius: 0; width: 100%; }
        .cal-approved-end { background: linear-gradient(to left, transparent 50%, #cbd5e1 50%); }
        .cal-approved-end button { background-color: #94a3b8 !important; color: #fff !important; border-radius: 9999px; }
        .cal-approved-single button { background-color: #94a3b8 !important; color: #fff !important; border-radius: 9999px; }
      `}</style>
    </div>
  );
}

function ReservationListCard({ range }: { range: BlockedRange }) {
  const checkIn = new Date(range.checkIn);
  const checkOut = new Date(range.checkOut);
  const nights = getNights(range.checkIn, range.checkOut);

  return (
    <div className="rounded-2xl border border-slate-200 px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <StatusBadge status={range.status} />
        <span className="text-xs text-slate-400">{nights}박</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="mb-0.5 text-xs text-slate-400">체크인</p>
          <p className="text-sm font-medium text-slate-900">
            {format(checkIn, "M월 d일 (EEE)", { locale: ko })}
          </p>
        </div>
        <span className="text-sm text-slate-300">→</span>
        <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="mb-0.5 text-xs text-slate-400">체크아웃</p>
          <p className="text-sm font-medium text-slate-900">
            {format(checkOut, "M월 d일 (EEE)", { locale: ko })}
          </p>
        </div>
      </div>
      <p className="mt-2.5 text-xs text-slate-400">{maskName(range.guestName)} 님</p>
    </div>
  );
}
