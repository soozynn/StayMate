import { Schema, model, models, type InferSchemaType } from "mongoose";

export const USER_ROLES = ["user", "admin"] as const;

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: Date,
    image: String,
    role: {
      type: String,
      enum: USER_ROLES,
      default: "user",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    sparse: true,
  },
);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel = models.User || model("User", userSchema);
