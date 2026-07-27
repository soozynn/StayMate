import { PageHeader } from "@/components/layout/page-header";
import { ManualReservationForm } from "./manual-reservation-form";

export default function AdminManualReservationPage() {
  return (
    <>
      <PageHeader subtitle="관리자" title="예약 수동 등록" />
      <div className="px-5">
        <ManualReservationForm />
      </div>
    </>
  );
}
