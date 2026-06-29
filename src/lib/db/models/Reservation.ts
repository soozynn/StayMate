import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

export const RESERVATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export const REVIEW_SOURCES = ["email", "admin"] as const;

const reservationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    guestEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
      max: 3,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    memo: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: RESERVATION_STATUSES,
      default: "pending",
      required: true,
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    reviewedAt: Date,
    reviewedBy: {
      type: String,
      lowercase: true,
      trim: true,
    },
    reviewSource: {
      type: String,
      enum: REVIEW_SOURCES,
    },
    actionTokenHash: String,
    actionTokenExpiresAt: Date,
  },
  {
    timestamps: true,
  },
);

reservationSchema.index({ checkIn: 1, checkOut: 1, status: 1 });
reservationSchema.index({ status: 1, createdAt: -1 });
reservationSchema.index({ userId: 1, createdAt: -1 });

reservationSchema.pre("validate", function validateDateRange(next) {
  if (this.checkIn && this.checkOut && this.checkIn >= this.checkOut) {
    this.invalidate("checkOut", "checkOut must be after checkIn");
  }

  next();
});

export type Reservation = InferSchemaType<typeof reservationSchema>;
export type ReservationDocument = HydratedDocument<Reservation>;

export const ReservationModel =
  models.Reservation || model("Reservation", reservationSchema);
