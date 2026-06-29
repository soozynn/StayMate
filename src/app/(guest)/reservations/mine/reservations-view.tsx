"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useState } from "react";

import { StatusBadge } from "@/components/ui/badge";
import type { SerializedReservation } from "@/lib/services/reservation.service";

export function ReservationsView({
  initialReservations,
}: {
  initialReservations: SerializedReservation[];
}) {
  const [reservations, setReservations] = useState(initialReservations);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r)),
      );
    } catch {
      alert("취소 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setCancellingId(null);
      setConfirmId(null);
    }
  }

  const active = reservations.filter(
    (r) => r.status === "pending" || r.status === "approved",
  );
  const past = reservations.filter(
    (r) => r.status === "rejected" || r.status === "cancelled",
  );

  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-slate-400">예약 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {active.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">진행 중인 예약</h2>
            <div className="space-y-3">
              {active.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onCancelRequest={() => setConfirmId(r.id)}
                />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-400">지난 예약</h2>
            <div className="space-y-3">
              {past.map((r) => (
                <ReservationCard key={r.id} reservation={r} />
              ))}
            </div>
          </section>
        )}
      </div>

      {confirmId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setConfirmId(null)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[480px] rounded-t-2xl bg-white px-6 pt-6"
            style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
          >
            <p className="mb-1 text-base font-bold text-slate-900">예약을 취소할까요?</p>
            <p className="mb-6 text-sm text-slate-500">취소된 예약은 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700"
              >
                돌아가기
              </button>
              <button
                type="button"
                disabled={cancellingId === confirmId}
                onClick={() => handleCancel(confirmId)}
                className="flex-1 rounded-xl bg-red-500 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {cancellingId === confirmId ? "취소 중..." : "예약 취소"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ReservationCard({
  reservation,
  onCancelRequest,
}: {
  reservation: SerializedReservation;
  onCancelRequest?: () => void;
}) {
  const checkIn = new Date(reservation.checkIn);
  const checkOut = new Date(reservation.checkOut);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const canCancel = reservation.status === "pending" || reservation.status === "approved";

  return (
    <div className="rounded-2xl border border-slate-200 px-4 py-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {format(checkIn, "yyyy.MM.dd (EEE)", { locale: ko })} –{" "}
            {format(checkOut, "MM.dd (EEE)", { locale: ko })}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {nights}박 · {reservation.guestCount}인
          </p>
        </div>
        <StatusBadge status={reservation.status} />
      </div>

      {reservation.memo && (
        <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {reservation.memo}
        </p>
      )}

      {canCancel && onCancelRequest && (
        <button
          type="button"
          onClick={onCancelRequest}
          className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          예약 취소
        </button>
      )}
    </div>
  );
}
