import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminBottomNav } from "@/components/layout/admin-bottom-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="mobile-container bg-[--color-background]">
      <div className="sticky top-0 z-40 flex items-center justify-between bg-slate-900 px-5 py-2 text-white">
        <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          관리자 모드
        </span>
        <Link href="/" className="text-xs text-slate-300 underline underline-offset-2">
          게스트 화면으로
        </Link>
      </div>
      <main className="pb-20">{children}</main>
      <AdminBottomNav />
    </div>
  );
}
