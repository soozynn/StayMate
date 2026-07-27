"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { DateRangePicker } from "@/components/booking/date-range-picker";
import type { SerializedAdminBlock } from "@/lib/services/admin-block.service";

async function fetchBlocks(): Promise<SerializedAdminBlock[]> {
  const res = await fetch("/api/admin/blocked-dates");
  if (!res.ok) throw new Error("Failed to fetch");
  return (await res.json()).blocks;
}

async function createBlock(body: { startDate: string; endDate: string; reason?: string }) {
  const res = await fetch("/api/admin/blocked-dates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to create block");
  return res.json();
}

async function deleteBlock(id: string) {
  const res = await fetch(`/api/admin/blocked-dates/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete block");
}

export function BlockedDatesView() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ["admin-blocked-dates"],
    queryFn: fetchBlocks,
    staleTime: 30 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-dates"] });
      setDateRange(undefined);
      setReason("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blocked-dates"] });
      setDeletingId(null);
    },
  });

  // DateRangePicker용 blockedRanges — 기존 차단 날짜만 넘겨서 겹침 방지
  const blockedRanges = blocks.map((b) => ({
    id: b.id,
    checkIn: b.startDate,
    checkOut: b.endDate,
    status: "approved" as const,
    guestName: "",
  }));

  const canSave = Boolean(dateRange?.from && dateRange?.to);

  function handleSave() {
    if (!dateRange?.from || !dateRange?.to) return;
    createMutation.mutate({
      startDate: startOfDay(dateRange.from).toISOString(),
      endDate: startOfDay(dateRange.to).toISOString(),
      reason: reason.trim() || undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* 날짜 선택 섹션 */}
      <div>
        <p className="mb-3 text-sm font-medium text-slate-900">차단할 날짜 선택</p>

        {/* 날짜 선택 박스 (게스트 예약하기 스타일 통일) */}
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
                시작일
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
                종료일
              </span>
            </div>
            <p
              className={`text-sm font-medium ${
                dateRange?.to ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {dateRange?.to ? format(dateRange.to, "M월 d일 (EEE)", { locale: ko }) : "—"}
            </p>
          </div>
        </div>

        <DateRangePicker
          blockedRanges={blockedRanges}
          value={dateRange}
          onChange={setDateRange}
        />

        {canSave && (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="차단 사유 입력 (선택)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none"
            />
            <button
              type="button"
              disabled={createMutation.isPending}
              onClick={handleSave}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {createMutation.isPending ? "저장 중..." : "차단 저장"}
            </button>
          </div>
        )}
      </div>

      {/* 차단 목록 */}
      <div>
        <p className="mb-3 text-sm font-medium text-slate-900">
          차단된 날짜 목록
          {blocks.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-400">{blocks.length}건</span>
          )}
        </p>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : blocks.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            차단된 날짜가 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {blocks.map((b) => {
              const start = new Date(b.startDate);
              const end = new Date(b.endDate);
              const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              const isDeleting = deletingId === b.id;

              return (
                <div key={b.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {format(start, "M월 d일 (EEE)", { locale: ko })}
                      {" → "}
                      {format(end, "M월 d일 (EEE)", { locale: ko })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {nights}박 차단{b.reason ? ` · ${b.reason}` : ""}
                    </p>
                  </div>

                  {isDeleting ? (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(b.id)}
                        className="rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                      >
                        {deleteMutation.isPending ? "..." : "삭제"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingId(b.id)}
                      className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-red-200 hover:text-red-400"
                    >
                      삭제
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
