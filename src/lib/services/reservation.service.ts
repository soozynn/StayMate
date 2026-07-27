import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { after } from "next/server";
import { Types } from "mongoose";

import { AdminBlockModel } from "@/lib/db/models/AdminBlock";
import {
  ReservationModel,
  type ReservationDocument,
} from "@/lib/db/models/Reservation";
import { connectMongoose } from "@/lib/db/mongoose";
import {
  sendAdminNotification,
  sendGuestCancellation,
  sendGuestConfirmation,
  sendGuestRejection,
} from "@/lib/services/email.service";
import type {
  CreateManualReservationInput,
  CreateReservationWithSessionInput,
  UpdateReservationStatusInput,
} from "@/lib/validators/reservation.schema";

export type ReservationStatus = "pending" | "approved" | "rejected" | "cancelled";

const BLOCKING_STATUSES: ReservationStatus[] = ["pending", "approved"];

type ServiceErrorCode =
  | "INVALID_ID"
  | "NOT_FOUND"
  | "OVERLAP"
  | "ALREADY_REVIEWED"
  | "TOKEN_REQUIRED"
  | "TOKEN_INVALID"
  | "FORBIDDEN"
  | "CANNOT_CANCEL";

export class ReservationServiceError extends Error {
  constructor(
    public code: ServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ReservationServiceError";
  }
}

export type SerializedReservation = {
  id: string;
  userId: string | null;
  guestName: string;
  guestEmail: string;
  guestCount: number;
  checkIn: string;
  checkOut: string;
  memo?: string;
  status: ReservationStatus;
  adminNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewSource?: "email" | "admin";
  createdAt: string;
  updatedAt: string;
};

export function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new ReservationServiceError("INVALID_ID", "Invalid reservation id");
  }

  return new Types.ObjectId(id);
}

function optionalDateToISOString(value?: Date | null) {
  return value ? value.toISOString() : undefined;
}

export function serializeReservation(
  reservation: ReservationDocument,
): SerializedReservation {
  return {
    id: reservation.id,
    userId: reservation.userId ? reservation.userId.toString() : null,
    guestName: reservation.guestName,
    guestEmail: reservation.guestEmail,
    guestCount: reservation.guestCount,
    checkIn: reservation.checkIn.toISOString(),
    checkOut: reservation.checkOut.toISOString(),
    memo: reservation.memo || undefined,
    status: reservation.status as ReservationStatus,
    adminNote: reservation.adminNote || undefined,
    reviewedAt: optionalDateToISOString(reservation.reviewedAt),
    reviewedBy: reservation.reviewedBy || undefined,
    reviewSource: (reservation.reviewSource as "email" | "admin" | null) || undefined,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}

export function getBlockingOverlapFilter(checkIn: Date, checkOut: Date) {
  return {
    status: { $in: BLOCKING_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function assertValidActionToken(
  reservation: ReservationDocument,
  token?: string,
) {
  if (!token) {
    throw new ReservationServiceError("TOKEN_REQUIRED", "Token is required");
  }

  if (
    !reservation.actionTokenHash ||
    !reservation.actionTokenExpiresAt ||
    reservation.actionTokenExpiresAt < new Date()
  ) {
    throw new ReservationServiceError("TOKEN_INVALID", "Token is invalid");
  }

  const expected = Buffer.from(reservation.actionTokenHash, "hex");
  const actual = Buffer.from(hashToken(token), "hex");

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new ReservationServiceError("TOKEN_INVALID", "Token is invalid");
  }
}

export async function hasOverlappingReservation(
  checkIn: Date,
  checkOut: Date,
) {
  await connectMongoose();

  const overlap = await ReservationModel.exists(
    getBlockingOverlapFilter(checkIn, checkOut),
  );

  return Boolean(overlap);
}

export async function createReservation(
  input: CreateReservationWithSessionInput,
) {
  await connectMongoose();

  const hasOverlap = await hasOverlappingReservation(
    input.checkIn,
    input.checkOut,
  );

  if (hasOverlap) {
    throw new ReservationServiceError(
      "OVERLAP",
      "Selected dates are already blocked",
    );
  }

  // 1회용 빠른 승인/거절을 위한 무작위 액션 토큰 생성
  const token = randomBytes(32).toString("hex");
  const actionTokenHash = hashToken(token);
  const actionTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 유효

  const reservation = await ReservationModel.create({
    ...input,
    status: "pending",
    memo: input.memo || undefined,
    actionTokenHash,
    actionTokenExpiresAt,
  });

  const serialized = serializeReservation(reservation);

  // after()로 응답 후 이메일 전송 보장 (Vercel 서버리스에서 fire-and-forget 소멸 방지)
  after(async () => {
    try {
      await sendAdminNotification(serialized, token);
    } catch (error) {
      console.error("[ReservationService] 관리자 예약 접수 메일 전송 실패:", error);
    }
  });

  return serialized;
}

export async function hasBlockingConflict(checkIn: Date, checkOut: Date) {
  await connectMongoose();

  const [reservationOverlap, blockOverlap] = await Promise.all([
    ReservationModel.exists(getBlockingOverlapFilter(checkIn, checkOut)),
    AdminBlockModel.exists({
      startDate: { $lt: checkOut },
      endDate: { $gt: checkIn },
    }),
  ]);

  return Boolean(reservationOverlap || blockOverlap);
}

export async function createManualReservation(
  input: CreateManualReservationInput,
  admin: { email: string },
) {
  await connectMongoose();

  const hasConflict = await hasBlockingConflict(input.checkIn, input.checkOut);

  if (hasConflict) {
    throw new ReservationServiceError(
      "OVERLAP",
      "Selected dates are already blocked",
    );
  }

  const reservation = await ReservationModel.create({
    ...input,
    memo: input.memo || undefined,
    status: "approved",
    reviewedAt: new Date(),
    reviewedBy: admin.email,
    reviewSource: "admin",
  });

  const serialized = serializeReservation(reservation);

  after(async () => {
    try {
      await sendGuestConfirmation(serialized);
    } catch (error) {
      console.error("[ReservationService] 수동 등록 확정 메일 전송 실패:", error);
    }
  });

  return serialized;
}

export async function getReservationById(id: string) {
  await connectMongoose();

  const reservation = await ReservationModel.findById(toObjectId(id)).exec();

  if (!reservation) {
    throw new ReservationServiceError("NOT_FOUND", "Reservation not found");
  }

  return serializeReservation(reservation);
}

export async function listReservations(options?: {
  userId?: string;
  status?: ReservationStatus;
  search?: string;
  from?: Date;
  to?: Date;
}) {
  await connectMongoose();

  const filter: Record<string, unknown> = {};

  if (options?.userId) {
    filter.userId = toObjectId(options.userId);
  }

  if (options?.status) {
    filter.status = options.status;
  }

  if (options?.search) {
    const pattern = new RegExp(
      options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter.$or = [{ guestName: pattern }, { guestEmail: pattern }];
  }

  if (options?.from || options?.to) {
    const checkInFilter: Record<string, Date> = {};
    if (options.from) checkInFilter.$gte = options.from;
    if (options.to) checkInFilter.$lte = options.to;
    filter.checkIn = checkInFilter;
  }

  type LeanDoc = {
    _id: Types.ObjectId;
    userId?: Types.ObjectId;
    guestName: string;
    guestEmail: string;
    guestCount: number;
    checkIn: Date;
    checkOut: Date;
    memo?: string;
    status: string;
    adminNote?: string;
    reviewedAt?: Date;
    reviewedBy?: string;
    reviewSource?: string;
    createdAt: Date;
    updatedAt: Date;
  };

  const raw = await ReservationModel.find(filter)
    .select("-actionTokenHash -actionTokenExpiresAt")
    .sort({ createdAt: -1 })
    .lean<LeanDoc[]>()
    .exec();

  return raw.map<SerializedReservation>((r) => ({
    id: r._id.toString(),
    userId: r.userId ? r.userId.toString() : null,
    guestName: r.guestName,
    guestEmail: r.guestEmail,
    guestCount: r.guestCount,
    checkIn: r.checkIn.toISOString(),
    checkOut: r.checkOut.toISOString(),
    memo: r.memo || undefined,
    status: r.status as ReservationStatus,
    adminNote: r.adminNote || undefined,
    reviewedAt: r.reviewedAt?.toISOString(),
    reviewedBy: r.reviewedBy || undefined,
    reviewSource: (r.reviewSource as "email" | "admin" | null) || undefined,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function updateStatus(
  id: string,
  status: Extract<ReservationStatus, "approved" | "rejected" | "cancelled">,
  options: Omit<UpdateReservationStatusInput, "status">,
) {
  await connectMongoose();

  const reservation = await ReservationModel.findById(toObjectId(id)).exec();

  if (!reservation) {
    throw new ReservationServiceError("NOT_FOUND", "Reservation not found");
  }

  if (status === "cancelled") {
    if (reservation.status === "cancelled" || reservation.status === "rejected") {
      throw new ReservationServiceError(
        "CANNOT_CANCEL",
        "This reservation cannot be cancelled",
      );
    }
  } else if (reservation.status !== "pending") {
    throw new ReservationServiceError(
      "ALREADY_REVIEWED",
      "Only pending reservations can be reviewed",
    );
  }

  if (options.source === "email") {
    assertValidActionToken(reservation, options.token);
  }

  reservation.status = status;
  reservation.reviewedAt = new Date();
  reservation.reviewedBy = options.reviewedBy;
  reservation.reviewSource = options.source;
  reservation.adminNote = options.adminNote || undefined;
  reservation.actionTokenHash = undefined;
  reservation.actionTokenExpiresAt = undefined;

  await reservation.save();

  const serialized = serializeReservation(reservation);

  // after()로 응답 후 이메일 전송 보장 (Vercel 서버리스에서 fire-and-forget 소멸 방지)
  after(async () => {
    try {
      if (status === "approved") {
        await sendGuestConfirmation(serialized);
      } else if (status === "rejected") {
        await sendGuestRejection(serialized, options.adminNote);
      } else if (status === "cancelled") {
        await sendGuestCancellation(serialized, options.adminNote);
      }
    } catch (error) {
      console.error("[ReservationService] 게스트 메일 전송 실패:", error);
    }
  });

  return serialized;
}

export async function cancelReservation(id: string, requestingUserId: string) {
  await connectMongoose();

  const reservation = await ReservationModel.findById(toObjectId(id)).exec();

  if (!reservation) {
    throw new ReservationServiceError("NOT_FOUND", "Reservation not found");
  }

  if (reservation.userId?.toString() !== requestingUserId) {
    throw new ReservationServiceError("FORBIDDEN", "Forbidden");
  }

  if (reservation.status === "cancelled" || reservation.status === "rejected") {
    throw new ReservationServiceError(
      "CANNOT_CANCEL",
      "This reservation cannot be cancelled",
    );
  }

  reservation.status = "cancelled";
  reservation.actionTokenHash = undefined;
  reservation.actionTokenExpiresAt = undefined;

  await reservation.save();

  return serializeReservation(reservation);
}

export function getReservationServiceStatus(error: ReservationServiceError) {
  switch (error.code) {
    case "INVALID_ID":
      return 400;
    case "OVERLAP":
    case "ALREADY_REVIEWED":
    case "CANNOT_CANCEL":
      return 409;
    case "TOKEN_REQUIRED":
    case "TOKEN_INVALID":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
  }
}
