import { Schema, model, models, type HydratedDocument, type InferSchemaType } from "mongoose";

const adminBlockSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true, maxlength: 200 },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

adminBlockSchema.index({ startDate: 1, endDate: 1 });

adminBlockSchema.pre("validate", function (next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    this.invalidate("endDate", "endDate must be after startDate");
  }
  next();
});

export type AdminBlock = InferSchemaType<typeof adminBlockSchema>;
export type AdminBlockDocument = HydratedDocument<AdminBlock>;

export const AdminBlockModel =
  models.AdminBlock || model("AdminBlock", adminBlockSchema);
