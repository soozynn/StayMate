import { PageHeader } from "@/components/layout/page-header";
import { ReservationsAdminView } from "./reservations-admin-view";

export default function AdminReservationsPage() {
  return (
    <>
      <PageHeader subtitle="관리자" title="예약 목록" />
      <div className="px-5">
        <ReservationsAdminView />
      </div>
    </>
  );
}
