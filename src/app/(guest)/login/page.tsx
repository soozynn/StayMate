import { Suspense } from "react";

import { LoginButtons } from "@/components/auth/login-buttons";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50 px-5 py-10">
      <section className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-500">StayMate</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
            예약을 계속하려면 로그인해 주세요
          </h1>
        </div>
        <Suspense fallback={<div className="h-40" />}>
          <LoginButtons />
        </Suspense>
      </section>
    </main>
  );
}
