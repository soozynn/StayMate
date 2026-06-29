import { auth } from "@/auth";
import { PageHeader } from "@/components/layout/page-header";
import { BookConfirmForm } from "./confirm-content";

type SearchParams = Promise<{
  checkIn?: string;
  checkOut?: string;
  guestCount?: string;
}>;

export default async function BookConfirmPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  return (
    <>
      <PageHeader subtitle="예약 확인" title="예약 정보 입력" />
      <BookConfirmForm
        checkIn={params.checkIn}
        checkOut={params.checkOut}
        guestCount={params.guestCount}
        defaultName={session?.user?.name ?? ""}
        defaultEmail={session?.user?.email ?? ""}
      />
    </>
  );
}
