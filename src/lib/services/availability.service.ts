import { ReservationModel } from "@/lib/db/models/Reservation";
import { connectMongoose } from "@/lib/db/mongoose";
import { getBlockingOverlapFilter } from "@/lib/services/reservation.service";

export type BlockedRange = {
  id: string;
  checkIn: string;
  checkOut: string;
  status: "pending" | "approved";
  guestName: string;
};

export async function getBlockedRanges(from: Date, to: Date) {
  await connectMongoose();

  const reservations = await ReservationModel.find(
    getBlockingOverlapFilter(from, to),
  )
    .select({ checkIn: 1, checkOut: 1, status: 1, guestName: 1 })
    .sort({ checkIn: 1 })
    .exec();

  return reservations.map<BlockedRange>((reservation) => ({
    id: reservation.id,
    checkIn: reservation.checkIn.toISOString(),
    checkOut: reservation.checkOut.toISOString(),
    status: reservation.status as "pending" | "approved",
    guestName: reservation.guestName,
  }));
}
