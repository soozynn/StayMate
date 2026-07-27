"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/ui/badge";
import type { SerializedReservation } from "@/lib/services/reservation.service";
import { useReservationStatusMutation } from "./use-reservation-status-mutation";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "cancelled";

async function fetchAdminReservations(params: {
  status: StatusFilter;
  search: string;
  from: string;
  to: string;
}): Promise<SerializedReservation[]> {
  const query = new URLSearchParams();
  if (params.status !== "all") query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);

  const qs = query.toString();
  const res = await fetch(`/api/admin/reservations${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.reservations;
}

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거절" },
  { value: "cancelled", label: "취소" },
];

type PendingAction = { id: string; type: "reject" | "cancel" };

export function ReservationsAdminView() {
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["admin-reservations", filter, search, dateFrom, dateTo],
    queryFn: () =>
      fetchAdminReservations({ status: filter, search, from: dateFrom, to: dateTo }),
    staleTime: 30 * 1000,
  });

  const mutation = useReservationStatusMutation();

  function handleAction(id: string, status: "approved" | "rejected" | "cancelled", note?: string) {
    mutation.mutate(
      { id, status, note },
      {
        onSuccess: () => {
          setPendingAction(null);
          setNoteText("");
        },
      },
    );
  }

  const pending = reservations.filter((r) => r.status === "pending");

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="이름 또는 이메일 검색"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShowDateFilter((v) => !v)}
          className={[
            "shrink-0 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-colors",
            showDateFilter || dateFrom || dateTo
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 text-slate-500",
          ].join(" ")}
        >
          기간
        </button>
      </div>

      {showDateFilter && (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-700 focus:outline-none"
          />
          <span className="text-xs text-slate-300">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-700 focus:outline-none"
          />
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="shrink-0 text-xs text-slate-400 underline"
            >
              초기화
            </button>
          )}
        </div>
      )}

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
            const isApproved = r.status === "approved";
            const isActing = mutation.isPending && mutation.variables?.id === r.id;
            const isEditingThis = pendingAction?.id === r.id;

            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/admin/reservations/${r.id}`} className="truncate text-sm font-semibold text-slate-900 underline-offset-2 hover:underline">
                      {r.guestName}
                    </Link>
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
                    {isEditingThis && pendingAction?.type === "reject" ? (
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
                            onClick={() => setPendingAction(null)}
                            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-500"
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleAction(r.id, "rejected", noteText)}
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
                          onClick={() => {
                            setPendingAction({ id: r.id, type: "reject" });
                            setNoteText("");
                          }}
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

                {isApproved && (
                  <div className="mt-3 space-y-2">
                    {isEditingThis && pendingAction?.type === "cancel" ? (
                      <>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="취소 사유 입력 (선택)"
                          rows={2}
                          className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPendingAction(null)}
                            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-500"
                          >
                            닫기
                          </button>
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleAction(r.id, "cancelled", noteText)}
                            className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-medium text-white disabled:opacity-60"
                          >
                            {isActing ? "처리 중..." : "취소 확정"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => {
                          setPendingAction({ id: r.id, type: "cancel" });
                          setNoteText("");
                        }}
                        className="w-full rounded-xl border-[1.5px] border-red-400 py-2.5 text-xs font-medium text-red-500 disabled:opacity-60"
                      >
                        예약 취소
                      </button>
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
