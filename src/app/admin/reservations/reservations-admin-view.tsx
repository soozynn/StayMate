"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";

import { StatusBadge } from "@/components/ui/badge";
import type { SerializedReservation } from "@/lib/services/reservation.service";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "cancelled";

async function fetchAdminReservations(status?: string): Promise<SerializedReservation[]> {
  const params = status && status !== "all" ? `?status=${status}` : "";
  const res = await fetch(`/api/admin/reservations${params}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.reservations;
}

async function updateReservationStatus(
  id: string,
  status: "approved" | "rejected",
  adminNote?: string,
) {
  const res = await fetch(`/api/admin/reservations/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, source: "admin", adminNote }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거절" },
  { value: "cancelled", label: "취소" },
];

export function ReservationsAdminView() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["admin-reservations", filter],
    queryFn: () => fetchAdminReservations(filter),
    staleTime: 30 * 1000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: "approved" | "rejected"; note?: string }) =>
      updateReservationStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      setNoteId(null);
      setNoteText("");
    },
  });

  function handleAction(id: string, status: "approved" | "rejected") {
    mutation.mutate({ id, status, note: noteId === id ? noteText : undefined });
  }

  const pending = reservations.filter((r) => r.status === "pending");

  return (
    <div className="space-y-4">
      {/* 필터 탭 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={[
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              filter === tab.value
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-500",
            ].join(" ")}
          >
            {tab.label}
            {tab.value === "pending" && pending.length > 0 && filter !== "pending" && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="py-20 text-center text-sm text-slate-400">
          {filter === "pending" ? "대기 중인 예약이 없습니다." : "예약 내역이 없습니다."}
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const checkIn = new Date(r.checkIn);
            const checkOut = new Date(r.checkOut);
            const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            const isPending = r.status === "pending";
            const isActing = mutation.isPending && mutation.variables?.id === r.id;

            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{r.guestName}</p>
                    <p className="truncate text-xs text-slate-400">{r.guestEmail}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                <p className="mb-3 text-xs text-slate-400">
                  {nights}박 · {r.guestCount}인 · {format(new Date(r.createdAt), "M/d HH:mm 접수", { locale: ko })}
                </p>

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

                {r.memo && (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                    {r.memo}
                  </p>
                )}

                {r.adminNote && !isPending && (
                  <p className="mt-2 text-xs text-slate-400">
                    관리자 메모: {r.adminNote}
                  </p>
                )}

                {isPending && (
                  <div className="mt-3 space-y-2">
                    {noteId === r.id ? (
                      <>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="거절 사유 입력 (선택)"
                          rows={2}
                          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setNoteId(null)}
                            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-500"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleAction(r.id, "rejected")}
                            className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-medium text-white disabled:opacity-60"
                          >
                            {isActing ? "처리 중..." : "거절 확정"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => setNoteId(r.id)}
                          className="flex-1 rounded-xl border-[1.5px] border-red-400 py-2.5 text-xs font-medium text-red-500 disabled:opacity-60"
                        >
                          거절
                        </button>
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleAction(r.id, "approved")}
                          className="flex-1 rounded-xl bg-slate-900 py-2.5 text-xs font-medium text-white disabled:opacity-60"
                        >
                          {isActing ? "처리 중..." : "승인"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
