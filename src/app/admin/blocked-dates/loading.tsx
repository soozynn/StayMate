import { PageHeader } from "@/components/layout/page-header";

export default function AdminBlockedDatesLoading() {
  return (
    <>
      <PageHeader subtitle="관리자" title="날짜 차단" />
      <div className="space-y-6 px-5">
        <div>
          <div className="mb-3 h-4 w-28 animate-pulse rounded bg-slate-100" />
          <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div>
          <div className="mb-3 h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="space-y-2">
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
    </>
  );
}
