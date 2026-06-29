"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#3C1E1E"
        d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.636 5.08 4.118 6.48L5.1 21l4.527-2.98C10.019 18.16 11 18.3 12 18.3c5.523 0 10-3.477 10-7.5S17.523 3 12 3z"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#FFFFFF"
        d="M13.6 12.4 10.1 7H7v10h3.4V12.6L14 17h3.1V7H13.6z"
      />
    </svg>
  );
}

const providers = [
  {
    id: "google",
    label: "Google로 로그인",
    icon: <GoogleIcon />,
    className:
      "border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
  },
  {
    id: "kakao",
    label: "카카오로 로그인",
    icon: <KakaoIcon />,
    className: "bg-[#FEE500] text-[#3C1E1E] hover:bg-[#F0D800]",
  },
  {
    id: "naver",
    label: "네이버로 로그인",
    icon: <NaverIcon />,
    className: "bg-[#03C75A] text-white hover:bg-[#02B350]",
  },
];

export function LoginButtons() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/book/confirm";

  return (
    <div className="flex w-full flex-col gap-3">
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          onClick={() => signIn(provider.id, { callbackUrl })}
          className={`flex h-12 w-full items-center justify-center gap-3 rounded-lg px-4 text-sm font-semibold transition ${provider.className}`}
        >
          {provider.icon}
          {provider.label}
        </button>
      ))}
    </div>
  );
}
