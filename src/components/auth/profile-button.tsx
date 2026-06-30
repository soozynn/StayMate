"use client";

import { useSession } from "next-auth/react";

import { ProfileAvatar } from "./profile-avatar";

export function ProfileButton() {
  const { data: session } = useSession();

  return (
    <ProfileAvatar
      name={session?.user?.name ?? ""}
      email={session?.user?.email ?? ""}
      loggedIn={!!session?.user}
    />
  );
}
