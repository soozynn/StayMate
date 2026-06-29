import { auth } from "@/auth";
import { ProfileAvatar } from "./profile-avatar";

export async function ProfileButton() {
  const session = await auth();

  return (
    <ProfileAvatar
      name={session?.user?.name ?? ""}
      email={session?.user?.email ?? ""}
      loggedIn={!!session?.user}
    />
  );
}
