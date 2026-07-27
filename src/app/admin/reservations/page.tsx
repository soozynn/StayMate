import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { ReservationsAdminView } from "./reservations-admin-view";

export default function AdminReservationsPage() {
  return (
    <>
      <PageHeader
        subtitle="관리자"
        title="예약 목록"
        right={
          <Link
            href="/admin/reservations/new"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-lg font-medium text-white"
            aria-label="예약 수동 등록"
          >
            +
          </Link>
        }
      />
      <div className="px-5">
        <ReservationsAdminView />
      </div>
    </>
  );
}
