import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { listReservations } from "@/lib/services/reservation.service";

import { ReservationsView } from "./reservations-view";

async function ReservationsDataFetcher() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
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

export default function MyReservationsPage() {
  return (
    <>
      <PageHeader subtitle="StayMate" title="내 예약" />
      <div className="px-5">
        <Suspense fallback={<ReservationsSkeleton />}>
          <ReservationsDataFetcher />
        </Suspense>
      </div>
    </>
  );
}
