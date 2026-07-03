import { PageHeader } from "@/components/layout/page-header";
import { BlockedDatesView } from "./blocked-dates-view";

export default function AdminBlockedDatesPage() {
  return (
    <>
      <PageHeader subtitle="관리자" title="날짜 차단" />
      <div className="px-5">
        <BlockedDatesView />
      </div>
    </>
  );
}
