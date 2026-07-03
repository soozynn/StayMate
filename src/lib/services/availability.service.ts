import { AdminBlockModel } from "@/lib/db/models/AdminBlock";
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

  const [reservations, adminBlocks] = await Promise.all([
    ReservationModel.find(getBlockingOverlapFilter(from, to))
      .select({ checkIn: 1, checkOut: 1, status: 1, guestName: 1 })
      .sort({ checkIn: 1 })
      .exec(),
    AdminBlockModel.find({ startDate: { $lt: to }, endDate: { $gt: from } })
      .select({ startDate: 1, endDate: 1 })
      .sort({ startDate: 1 })
      .exec(),
  ]);

  const reservationRanges = reservations.map<BlockedRange>((r) => ({
    id: r.id,
    checkIn: r.checkIn.toISOString(),
    checkOut: r.checkOut.toISOString(),
    status: r.status as "pending" | "approved",
    guestName: r.guestName,
  }));

  const adminBlockRanges = adminBlocks.map<BlockedRange>((b) => ({
    id: b.id,
    checkIn: b.startDate.toISOString(),
    checkOut: b.endDate.toISOString(),
    status: "approved",
    guestName: "",
  }));

  return [...reservationRanges, ...adminBlockRanges];
}
