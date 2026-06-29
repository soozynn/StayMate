import { z } from "zod";

import {
  RESERVATION_STATUSES,
  REVIEW_SOURCES,
} from "@/lib/db/models/Reservation";

const dateLikeSchema = z.coerce.date();

export const reservationStatusSchema = z.enum(RESERVATION_STATUSES);
export const reviewSourceSchema = z.enum(REVIEW_SOURCES);

const createReservationBaseSchema = z.object({
  guestName: z.string().trim().min(1).max(50),
  guestEmail: z.string().trim().email("올바른 이메일 형식을 입력해주세요").max(254).optional(),
  guestCount: z.coerce.number().int().min(1).max(3),
  checkIn: dateLikeSchema,
  checkOut: dateLikeSchema,
  memo: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const createReservationSchema = createReservationBaseSchema
  .refine((value) => value.checkIn < value.checkOut, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });

export const createReservationWithSessionSchema = createReservationBaseSchema
  .extend({
    userId: z.string().min(1),
    guestEmail: z.string().trim().email().max(254),
  })
  .refine((value) => value.checkIn < value.checkOut, {
    message: "checkOut must be after checkIn",
    path: ["checkOut"],
  });

export const availabilityQuerySchema = z
  .object({
    from: dateLikeSchema,
    to: dateLikeSchema,
  })
  .refine((value) => value.from < value.to, {
    message: "to must be after from",
    path: ["to"],
  });

export const updateReservationStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  source: reviewSourceSchema,
  reviewedBy: z.string().trim().email().optional(),
  adminNote: z.string().trim().max(1000).optional().or(z.literal("")),
  token: z.string().min(1).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type CreateReservationWithSessionInput = z.infer<
  typeof createReservationWithSessionSchema
>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type UpdateReservationStatusInput = z.infer<
  typeof updateReservationStatusSchema
>;
