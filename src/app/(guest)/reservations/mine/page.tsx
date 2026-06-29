import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { connectMongoose } from "@/lib/db/mongoose";
import { PageHeader } from "@/components/layout/page-header";
import { listReservations } from "@/lib/services/reservation.service";
import { ReservationsView } from "./reservations-view";

async function ReservationsContent() {
  // auth()와 MongoDB 연결을 병렬 실행 — cold start 시 연결 대기 시간 단축
  const [session] = await Promise.all([auth(), connectMongoose()]);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // connectMongoose()가 이미 완료됐으므로 쿼리 즉시 실행
  const reservations = await listReservations({ userId: session.user.id });
  return <ReservationsView initialReservations={reservations} />;
}

function ReservationsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="h-28 w-full animate-pulse rounded-2xl border border-slate-100 bg-slate-100"
        />
      ))}
    </div>
  );
}

// 동기 컴포넌트 — await 없이 즉시 header + skeleton 렌더링 시작
export default function MyReservationsPage() {
  return (
    <>
      <PageHeader subtitle="StayMate" title="내 예약" />
      <div className="px-5">
        <Suspense fallback={<ReservationsSkeleton />}>
          <ReservationsContent />
        </Suspense>
      </div>
    </>
  );
}
