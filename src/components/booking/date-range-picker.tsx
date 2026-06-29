"use client";

import { format, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useMemo } from "react";
import { DayPicker, useDayPicker, type DateRange, type MonthCaptionProps } from "react-day-picker";
import "react-day-picker/style.css";

function MonthCaption({ calendarMonth }: MonthCaptionProps) {
  const { goToMonth, previousMonth, nextMonth } = useDayPicker();
  return (
    <div className="flex items-center justify-center gap-3 px-2 py-2">
      <button
        type="button"
        disabled={!previousMonth}
        onClick={() => previousMonth && goToMonth(previousMonth)}
        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30"
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
        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30"
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
};

type DateRangePickerProps = {
  blockedRanges: BlockedRange[];
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
};

type ParsedRange = { checkIn: Date; checkOut: Date; status: "pending" | "approved" };

// 모디파이어용: checkIn 포함 (시각적 색상 표시)
function inRange(date: Date, ranges: ParsedRange[]): boolean {
  return ranges.some((r) => date >= r.checkIn && date < r.checkOut);
}

// disabled용: checkIn 제외 (체크인 날짜는 이전 예약의 체크아웃으로 허용)
function inRangeInterior(date: Date, ranges: ParsedRange[]): boolean {
  return ranges.some((r) => date > r.checkIn && date < r.checkOut);
}

export function DateRangePicker({
  blockedRanges,
  value,
  onChange,
}: DateRangePickerProps) {
  const today = startOfDay(new Date());

  // Date 객체 변환을 한 번만 수행
  const parsed = useMemo<ParsedRange[]>(
    () =>
      blockedRanges.map((r) => ({
        checkIn: startOfDay(new Date(r.checkIn)),
        checkOut: startOfDay(new Date(r.checkOut)),
        status: r.status,
      })),
    [blockedRanges],
  );

  const pendingRanges = useMemo(() => parsed.filter((r) => r.status === "pending"), [parsed]);
  const approvedRanges = useMemo(() => parsed.filter((r) => r.status === "approved"), [parsed]);

  // checkIn 경계는 disabled 제외 → 이전 날 체크인 유저가 이 날짜를 체크아웃으로 선택 가능
  const disabledDays = useMemo(
    () => [{ before: today }, (date: Date) => inRangeInterior(date, parsed)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parsed],
  );

  // 범위 선택 검증: 예약된 checkIn 날짜를 새 checkIn 시작으로 막고, 실제 겹침도 차단
  function handleSelect(range: DateRange | undefined) {
    if (!range) { onChange(undefined); return; }

    const from = range.from ? startOfDay(range.from) : undefined;
    const to = range.to ? startOfDay(range.to) : undefined;

    if (from && !to) {
      // 예약된 checkIn 날짜를 새 예약의 시작일로 선택하는 것을 차단
      if (parsed.some((r) => from.getTime() === r.checkIn.getTime())) {
        onChange(undefined);
        return;
      }
    }

    if (from && to) {
      // 선택 범위가 기존 예약과 겹치면 차단 (checkIn < to AND checkOut > from)
      if (parsed.some((r) => r.checkIn < to && r.checkOut > from)) {
        onChange({ from: range.from, to: undefined });
        return;
      }
    }

    onChange(range);
  }

  const modifiers = useMemo(
    () => ({
      pending: (date: Date) => inRange(date, pendingRanges),
      approved: (date: Date) => inRange(date, approvedRanges),
    }),
    [pendingRanges, approvedRanges],
  );

  return (
    <div className="flex flex-col gap-3">
      <DayPicker
        mode="range"
        selected={value}
        onSelect={handleSelect}
        locale={ko}
        disabled={disabledDays}
        modifiers={modifiers}
        modifiersClassNames={{
          pending: "day--pending",
          approved: "day--approved",
        }}
        hideNavigation
        components={{ MonthCaption }}
        classNames={{
          root: "w-full",
          months: "w-full",
          month: "w-full",
          month_grid: "w-full",
          weekdays: "flex",
          weekday: "flex-1 text-center text-xs font-medium text-slate-400 py-2",
          week: "flex mt-1",
          day: "flex-1 flex items-center justify-center p-0",
          day_button:
            "h-9 w-9 rounded-full text-sm font-medium transition-all hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:line-through",
          range_start: "day--range-start",
          range_end: "day--range-end",
          range_middle: "day--range-middle",
          selected: "day--selected",
          today: "day--today",
          outside: "opacity-30",
          disabled: "opacity-30 cursor-not-allowed",
        }}
      />

      {/* 범례 */}
      <div className="flex items-center gap-4 px-1 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-amber-200 border border-amber-300" />
          승인 대기
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-slate-200 border border-slate-300" />
          예약됨
        </span>
      </div>

      <style>{`
        /* 선택된 날짜 시작/끝 — 검정 타원 + 흰 글씨 */
        .day--range-start button,
        .day--range-end button {
          background-color: #0f172a !important;
          color: #ffffff !important;
          border-radius: 9999px;
        }

        /* 범위 중간 날짜 — 연한 회색 배경 */
        .day--range-middle button {
          background-color: #e2e8f0 !important;
          color: #0f172a !important;
          border-radius: 0 !important;
          width: 100%;
        }

        /* 시작/끝에서 중간 배경 연결 */
        .day--range-start:not(.day--range-end) {
          background: linear-gradient(to right, transparent 50%, #e2e8f0 50%);
        }
        .day--range-end:not(.day--range-start) {
          background: linear-gradient(to left, transparent 50%, #e2e8f0 50%);
        }

        /* pending/approved 블록 */
        .day--pending button {
          background-color: #fde68a !important;
          color: #92400e !important;
        }
        .day--approved button {
          background-color: #e2e8f0 !important;
          color: #94a3b8 !important;
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
