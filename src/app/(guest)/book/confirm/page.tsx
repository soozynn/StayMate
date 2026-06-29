"use client";

import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const confirmSchema = z.object({
  guestName: z.string().trim().min(1, "이름을 입력해주세요").max(50),
  memo: z.string().trim().max(1000).optional(),
});

type ConfirmForm = z.infer<typeof confirmSchema>;

function BookConfirmContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  const guestCount = Number(params.get("guestCount") ?? 1);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmForm>({
    resolver: zodResolver(confirmSchema),
  });

  if (!checkIn || !checkOut) {
    return (
      <div className="px-5 py-10 text-center text-sm text-slate-500">
        날짜 정보가 없습니다.{" "}
        <button
          type="button"
          onClick={() => router.push("/book")}
          className="underline"
        >
          다시 선택하기
        </button>
      </div>
    );
  }

  const checkInDate = parseISO(checkIn);
  const checkOutDate = parseISO(checkOut);
  const nights = Math.round(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  async function onSubmit(data: ConfirmForm) {
    setSubmitError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn,
          checkOut,
          guestCount,
          guestName: data.guestName,
          memo: data.memo || undefined,
        }),
      });

      if (res.status === 401) {
        const callbackUrl = `/book/confirm?checkIn=${checkIn}&checkOut=${checkOut}&guestCount=${guestCount}`;
        router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        if (err?.details?.code === "OVERLAP") {
          setSubmitError("선택하신 날짜에 이미 다른 예약이 있습니다.");
        } else {
          setSubmitError("예약 신청 중 오류가 발생했습니다. 다시 시도해 주세요.");
        }
        return;
      }

      router.push("/reservations/complete");
    } catch {
      setSubmitError("네트워크 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <>
      <PageHeader subtitle="예약 확인" title="예약 정보 입력" />

      <div className="space-y-6 px-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">체크인</span>
            <span className="font-medium">{format(checkInDate, "yyyy.MM.dd")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">체크아웃</span>
            <span className="font-medium">{format(checkOutDate, "yyyy.MM.dd")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">숙박</span>
            <span className="font-medium">{nights}박</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">인원</span>
            <span className="font-medium">{guestCount}명</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="예약자 이름"
            placeholder="홍길동"
            error={errors.guestName?.message}
            {...register("guestName")}
          />
          <Textarea
            label="요청사항 (선택)"
            placeholder="특별한 요청사항이 있으시면 입력해 주세요."
            rows={3}
            hint="관리자에게 전달됩니다."
            error={errors.memo?.message}
            {...register("memo")}
          />

          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">
              {submitError}
            </p>
          )}

          <div className="space-y-2 pt-2">
            <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
              예약 신청하기
            </Button>
            <Button type="button" variant="ghost" fullWidth onClick={() => router.back()}>
              이전으로
            </Button>
          </div>
        </form>

        <p className="pb-4 text-center text-xs text-slate-400">
          예약 신청 후 관리자 승인 시 확정됩니다.
          <br />
          승인/거절 결과는 이메일로 안내드립니다.
        </p>
      </div>
    </>
  );
}

export default function BookConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        </div>
      }
    >
      <BookConfirmContent />
    </Suspense>
  );
}
