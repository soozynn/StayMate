"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

import { StatusBadge } from "@/components/ui/badge";
import type { SerializedReservation } from "@/lib/services/reservation.service";
import { cancelReservationAction } from "./actions";

async function fetchMyReservations(): Promise<SerializedReservation[]> {
  const res = await fetch("/api/reservations/mine");
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.reservations;
}

function ReservationsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-40 w-full animate-pulse rounded-2xl border border-slate-100 bg-slate-100"
        />
      ))}
    </div>
  );
}

export function ReservationsView() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["reservations", "mine"],
    queryFn: fetchMyReservations,
    staleTime: 60 * 1000,
  });

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      await cancelReservationAction(id);
      queryClient.setQueryData(
        ["reservations", "mine"],
        (prev: SerializedReservation[] = []) =>
          prev.map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r)),
      );
    } catch {
      alert("취소 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setCancellingId(null);
      setConfirmId(null);
    }
  }

  const initial = session?.user?.name?.charAt(0).toUpperCase() ?? "";

  const active = reservations.filter(
    (r) => r.status === "pending" || r.status === "approved",
  );
  const past = reservations.filter(
    (r) => r.status === "rejected" || r.status === "cancelled",
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{session?.user?.name}</p>
            <p className="truncate text-xs text-slate-400">{session?.user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
        >
          로그아웃
        </button>
      </div>

      {isLoading ? (
        <ReservationsSkeleton />
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-slate-400">예약 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                진행 중인 예약
              </h2>
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
            <>
              {active.length > 0 && <hr className="border-slate-100" />}
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  지난 예약
                </h2>
                <div className="space-y-2">
                  {past.map((r) => (
                    <PastReservationCard key={r.id} reservation={r} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      )}

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
      <StatusBadge status={reservation.status} />
      <p className="mt-1.5 text-xs text-slate-400">
        {nights}박 · {reservation.guestCount}인
      </p>

      <div className="mt-3 flex items-center gap-2">
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

      {reservation.memo && (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
          {reservation.memo}
        </p>
      )}

      {canCancel && onCancelRequest && (
        <button
          type="button"
          onClick={onCancelRequest}
          className="mt-3 w-full rounded-xl border-[1.5px] border-red-500 py-2.5 text-sm font-medium text-red-500 transition-opacity active:opacity-70"
        >
          예약 취소
        </button>
      )}
    </div>
  );
}

function PastReservationCard({ reservation }: { reservation: SerializedReservation }) {
  const checkIn = new Date(reservation.checkIn);
  const checkOut = new Date(reservation.checkOut);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="rounded-2xl border border-slate-100 px-4 py-3 opacity-60">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {format(checkIn, "M월 d일", { locale: ko })} →{" "}
          {format(checkOut, "M월 d일", { locale: ko })}
        </p>
        <StatusBadge status={reservation.status} />
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {nights}박 · {reservation.guestCount}인
      </p>
    </div>
  );
}
