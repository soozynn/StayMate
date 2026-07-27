import { PageHeader } from "@/components/layout/page-header";

export default function AdminReservationDetailLoading() {
  return (
    <>
      <PageHeader subtitle="관리자" title="예약 상세" />
      <div className="space-y-4 px-5">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </>
  );
}
