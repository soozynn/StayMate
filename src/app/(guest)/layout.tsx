import { BottomNav } from "@/components/layout/bottom-nav";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mobile-container bg-[--color-background]">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
