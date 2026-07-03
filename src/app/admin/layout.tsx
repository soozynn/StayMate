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
      <main className="pb-20">{children}</main>
      <AdminBottomNav />
    </div>
  );
}
