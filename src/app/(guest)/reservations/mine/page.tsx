import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { listReservations } from "@/lib/services/reservation.service";

import { ReservationsView } from "./reservations-view";

export default async function MyReservationsPage() {
  const session = await auth();

  if (!session?.user?.id) redirect("/login");

  const reservations = await listReservations({ userId: session.user.id });

  return (
    <>
      <PageHeader subtitle="StayMate" title="내 예약" />
      <div className="px-5">
        <ReservationsView initialReservations={reservations} />
      </div>
    </>
  );
}
