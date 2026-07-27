import { PageHeader } from "@/components/layout/page-header";
import { listAdminBlocks } from "@/lib/services/admin-block.service";
import { BlockedDatesView } from "./blocked-dates-view";

export default async function AdminBlockedDatesPage() {
  const initialBlocks = await listAdminBlocks();

  return (
    <>
      <PageHeader subtitle="관리자" title="날짜 차단" />
      <div className="px-5">
        <BlockedDatesView initialBlocks={initialBlocks} />
      </div>
    </>
  );
}
