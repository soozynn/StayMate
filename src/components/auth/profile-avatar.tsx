"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  name: string;
  email: string;
  loggedIn: boolean;
};

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export function ProfileAvatar({ name, email, loggedIn }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const initial = name.charAt(0).toUpperCase();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white"
      >
        {loggedIn ? initial : <UserIcon />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[480px] rounded-t-2xl bg-white px-6 pt-6"
            style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}
          >
            {loggedIn ? (
              <>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{name}</p>
                    <p className="truncate text-sm text-slate-500">{email}</p>
                  </div>
                </div>
                <hr className="mb-4 border-slate-100" />
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <UserIcon />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">로그인이 필요해요</p>
                    <p className="text-sm text-slate-500">로그인하면 예약이 가능합니다</p>
                  </div>
                </div>
                <hr className="mb-4 border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push("/login");
                  }}
                  className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                >
                  로그인하기
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
