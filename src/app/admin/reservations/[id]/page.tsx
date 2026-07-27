import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { getReservationById } from "@/lib/services/reservation.service";
import { ReservationDetailView } from "./reservation-detail-view";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminReservationDetailPage({ params }: Props) {
  const { id } = await params;

  let reservation;
  try {
    reservation = await getReservationById(id);
  } catch {
    notFound();
  }

  return (
    <>
      <PageHeader subtitle="관리자" title="예약 상세" />
      <div className="px-5">
        <ReservationDetailView id={id} initialReservation={reservation} />
      </div>
    </>
  );
}
