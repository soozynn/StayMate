"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addMonths, format, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { DateRange } from "react-day-picker";
import { z } from "zod";

import { DateRangePicker } from "@/components/booking/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BlockedRange } from "@/lib/services/availability.service";

const manualReservationSchema = z.object({
  guestName: z.string().trim().min(1, "이름을 입력해주세요").max(50),
  guestEmail: z
    .string()
    .trim()
    .min(1, "이메일을 입력해주세요")
    .email("올바른 이메일 형식을 입력해주세요")
    .max(254),
  memo: z.string().trim().max(1000).optional(),
});

type ManualReservationForm = z.infer<typeof manualReservationSchema>;

async function fetchBlockedRanges(from: Date, to: Date): Promise<BlockedRange[]> {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const res = await fetch(`/api/reservations/availability?${params}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.blockedRanges;
}

export function ManualReservationForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guestCount, setGuestCount] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const from = useMemo(() => startOfDay(new Date()), []);
  const to = useMemo(() => addMonths(from, 3), [from]);

  const { data: blockedRanges = [] } = useQuery({
    queryKey: ["blockedRanges", format(from, "yyyy-MM-dd")],
    queryFn: () => fetchBlockedRanges(from, to),
    staleTime: 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ManualReservationForm>({
    resolver: zodResolver(manualReservationSchema),
  });

  const canSubmit = Boolean(
    dateRange?.from && dateRange?.to && dateRange.from < dateRange.to,
  );

  async function onSubmit(data: ManualReservationForm) {
    if (!dateRange?.from || !dateRange?.to) return;
    setSubmitError(null);

    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn: dateRange.from.toISOString(),
          checkOut: dateRange.to.toISOString(),
          guestCount,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          memo: data.memo || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (err?.details?.code === "OVERLAP") {
          setSubmitError("선택하신 날짜에 이미 다른 예약 또는 차단이 있습니다.");
        } else {
          setSubmitError("등록 중 오류가 발생했습니다. 다시 시도해 주세요.");
        }
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      router.push("/admin/reservations");
    } catch {
      setSubmitError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-medium text-slate-900">인원 (최대 3명)</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
            disabled={guestCount <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg disabled:opacity-40"
          >
            −
          </button>
          <span className="w-6 text-center text-lg font-semibold">{guestCount}</span>
          <button
            type="button"
            onClick={() => setGuestCount((c) => Math.min(3, c + 1))}
            disabled={guestCount >= 3}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-lg disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-slate-900">날짜 선택</p>

        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="mb-0.5 text-xs text-slate-400">체크인</p>
            <p className={`text-sm font-medium ${dateRange?.from ? "text-slate-900" : "text-slate-400"}`}>
              {dateRange?.from
                ? format(dateRange.from, "M월 d일 (EEE)", { locale: ko })
                : "날짜를 선택해주세요"}
            </p>
          </div>
          <span className="text-sm text-slate-300">→</span>
          <div className="flex-1 rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="mb-0.5 text-xs text-slate-400">체크아웃</p>
            <p className={`text-sm font-medium ${dateRange?.to ? "text-slate-900" : "text-slate-400"}`}>
              {dateRange?.to ? format(dateRange.to, "M월 d일 (EEE)", { locale: ko }) : "—"}
            </p>
          </div>
        </div>

        <DateRangePicker blockedRanges={blockedRanges} value={dateRange} onChange={setDateRange} />
      </div>

      <div className="space-y-4">
        <Input
          label="예약자 이름"
          placeholder="홍길동"
          error={errors.guestName?.message}
          {...register("guestName")}
        />
        <Input
          label="이메일"
          type="email"
          placeholder="example@email.com"
          hint="승인/취소 안내를 받을 이메일입니다. 필수 입력입니다."
          error={errors.guestEmail?.message}
          {...register("guestEmail")}
        />
        <Textarea
          label="메모 (선택)"
          placeholder="전화/카톡 예약 관련 참고사항"
          rows={3}
          error={errors.memo?.message}
          {...register("memo")}
        />
      </div>

      {submitError && <p className="text-sm text-red-500">{submitError}</p>}

      <Button
        type="submit"
        fullWidth
        size="lg"
        disabled={!canSubmit || isSubmitting}
        loading={isSubmitting}
      >
        예약 등록
      </Button>
    </form>
  );
}
