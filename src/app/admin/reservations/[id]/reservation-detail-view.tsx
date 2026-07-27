"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";

import { StatusBadge } from "@/components/ui/badge";
import type { SerializedReservation } from "@/lib/services/reservation.service";
import { useReservationStatusMutation } from "../use-reservation-status-mutation";

async function fetchReservation(id: string): Promise<SerializedReservation> {
  const res = await fetch(`/api/admin/reservations/${id}`);
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.reservation;
}

const REVIEW_SOURCE_LABEL: Record<string, string> = {
  admin: "관리자",
  email: "이메일 링크",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

export function ReservationDetailView({
  id,
  initialReservation,
}: {
  id: string;
  initialReservation: SerializedReservation;
}) {
  const [action, setAction] = useState<"reject" | "cancel" | null>(null);
  const [noteText, setNoteText] = useState("");

  const { data: reservation = initialReservation } = useQuery({
    queryKey: ["admin-reservation", id],
    queryFn: () => fetchReservation(id),
    initialData: initialReservation,
    staleTime: 30 * 1000,
  });

  const mutation = useReservationStatusMutation();

  function handleAction(status: "approved" | "rejected" | "cancelled") {
    mutation.mutate(
      { id, status, note: noteText || undefined },
      {
        onSuccess: () => {
          setAction(null);
          setNoteText("");
        },
      },
    );
  }

  const checkIn = new Date(reservation.checkIn);
  const checkOut = new Date(reservation.checkOut);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const isPending = reservation.status === "pending";
  const isApproved = reservation.status === "approved";
  const isActing = mutation.isPending;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 px-4 py-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{reservation.guestName}</p>
            <p className="truncate text-xs text-slate-400">{reservation.guestEmail}</p>
          </div>
          <StatusBadge status={reservation.status} />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="mb-0.5 text-xs text-slate-400">체크인</p>
            <p className="text-sm font-medium text-slate-900">
              {format(checkIn, "yyyy년 M월 d일 (EEE)", { locale: ko })}
            </p>
          </div>
          <span className="text-sm text-slate-300">→</span>
          <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="mb-0.5 text-xs text-slate-400">체크아웃</p>
            <p className="text-sm font-medium text-slate-900">
              {format(checkOut, "yyyy년 M월 d일 (EEE)", { locale: ko })}
            </p>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-1">
          <InfoRow label="숙박" value={`${nights}박 · ${reservation.guestCount}인`} />
          <InfoRow
            label="접수일시"
            value={format(new Date(reservation.createdAt), "yyyy.MM.dd HH:mm", { locale: ko })}
          />
          {reservation.reviewedAt && (
            <InfoRow
              label="처리일시"
              value={format(new Date(reservation.reviewedAt), "yyyy.MM.dd HH:mm", { locale: ko })}
            />
          )}
          {reservation.reviewSource && (
            <InfoRow
              label="처리 경로"
              value={REVIEW_SOURCE_LABEL[reservation.reviewSource] ?? reservation.reviewSource}
            />
          )}
          {reservation.reviewedBy && <InfoRow label="처리자" value={reservation.reviewedBy} />}
        </div>

        {reservation.memo && (
          <div className="mt-3">
            <p className="mb-1 text-xs text-slate-400">게스트 요청사항</p>
            <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">{reservation.memo}</p>
          </div>
        )}

        {reservation.adminNote && (
          <div className="mt-3">
            <p className="mb-1 text-xs text-slate-400">관리자 메모</p>
            <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">{reservation.adminNote}</p>
          </div>
        )}
      </div>

      {isPending && (
        <div className="space-y-2">
          {action === "reject" ? (
            <>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="거절 사유 입력 (선택)"
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAction(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-500"
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={isActing}
                  onClick={() => handleAction("rejected")}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white disabled:opacity-60"
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
                  setAction("reject");
                  setNoteText("");
                }}
                className="flex-1 rounded-xl border-[1.5px] border-red-400 py-3 text-sm font-medium text-red-500 disabled:opacity-60"
              >
                거절
              </button>
              <button
                type="button"
                disabled={isActing}
                onClick={() => handleAction("approved")}
                className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {isActing ? "처리 중..." : "승인"}
              </button>
            </div>
          )}
        </div>
      )}

      {isApproved && (
        <div className="space-y-2">
          {action === "cancel" ? (
            <>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="취소 사유 입력 (선택)"
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-slate-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAction(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-500"
                >
                  닫기
                </button>
                <button
                  type="button"
                  disabled={isActing}
                  onClick={() => handleAction("cancelled")}
                  className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white disabled:opacity-60"
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
                setAction("cancel");
                setNoteText("");
              }}
              className="w-full rounded-xl border-[1.5px] border-red-400 py-3 text-sm font-medium text-red-500 disabled:opacity-60"
            >
              예약 취소
            </button>
          )}
        </div>
      )}
    </div>
  );
}
