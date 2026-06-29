import { PageHeader } from "@/components/layout/page-header";
import { ReservationsView } from "./reservations-view";

export default function MyReservationsPage() {
  return (
    <>
      <PageHeader subtitle="StayMate" title="내 예약" />
      <div className="px-5">
        <ReservationsView />
      </div>
    </>
  );
}
