import { Suspense } from "react";
import { addMonths, startOfDay } from "date-fns";
import { unstable_cache } from "next/cache";

import { PageHeader } from "@/components/layout/page-header";
import { getBlockedRanges } from "@/lib/services/availability.service";
import { CalendarView } from "./calendar-view";

// 60초 캐시 — 예약 현황은 자주 바뀌지 않으므로 60초 TTL로 DB 부하 경감
const getCachedBlockedRanges = unstable_cache(
  (fromISO: string, toISO: string) => getBlockedRanges(new Date(fromISO), new Date(toISO)),
  ["availability"],
  { revalidate: 60 },
);

async function CalendarContent() {
  const from = startOfDay(new Date());
  const to = addMonths(from, 6);
  const blockedRanges = await getCachedBlockedRanges(from.toISOString(), to.toISOString());
  return <CalendarView blockedRanges={blockedRanges} />;
}

function CalendarSkeleton() {
  return (
    <div className="px-5 space-y-3">
      <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-48 w-full animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <>
      <PageHeader subtitle="예약 현황" title="예약된 날짜 확인" />
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarContent />
      </Suspense>
    </>
  );
}
