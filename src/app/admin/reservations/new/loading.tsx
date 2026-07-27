import { PageHeader } from "@/components/layout/page-header";

export default function AdminManualReservationLoading() {
  return (
    <>
      <PageHeader subtitle="관리자" title="예약 수동 등록" />
      <div className="space-y-6 px-5">
        <div className="h-10 w-40 animate-pulse rounded bg-slate-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        <div className="space-y-4">
          <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </>
  );
}
