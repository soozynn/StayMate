"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { connectMongoose } from "@/lib/db/mongoose";
import { cancelReservation } from "@/lib/services/reservation.service";

export async function cancelReservationAction(id: string) {
  const [session] = await Promise.all([auth(), connectMongoose()]);

  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const reservation = await cancelReservation(id, session.user.id);

  revalidatePath("/calendar");
  revalidatePath("/book");
  revalidatePath("/reservations/mine");

  return reservation;
}
