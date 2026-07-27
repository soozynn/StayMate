import { PageHeader } from "@/components/layout/page-header";

export default function AdminReservationsLoading() {
  return (
    <>
      <PageHeader subtitle="관리자" title="예약 목록" />
      <div className="space-y-4 px-5">
        <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-14 shrink-0 animate-pulse rounded-full bg-slate-100" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </>
  );
}
