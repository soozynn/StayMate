"use server";

import { AdminBlockModel, type AdminBlockDocument } from "@/lib/db/models/AdminBlock";
import { connectMongoose } from "@/lib/db/mongoose";
import { Types } from "mongoose";

export type SerializedAdminBlock = {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  createdBy: string;
  createdAt: string;
};

function serialize(doc: AdminBlockDocument): SerializedAdminBlock {
  return {
    id: doc.id,
    startDate: doc.startDate.toISOString(),
    endDate: doc.endDate.toISOString(),
    reason: doc.reason || undefined,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function listAdminBlocks(): Promise<SerializedAdminBlock[]> {
  await connectMongoose();
  const docs = await AdminBlockModel.find().sort({ startDate: 1 }).exec();
  return docs.map(serialize);
}

export async function createAdminBlock(input: {
  startDate: Date;
  endDate: Date;
  reason?: string;
  createdBy: string;
}): Promise<SerializedAdminBlock> {
  await connectMongoose();
  const doc = await AdminBlockModel.create(input);
  return serialize(doc);
}

export async function deleteAdminBlock(id: string): Promise<void> {
  await connectMongoose();
  if (!Types.ObjectId.isValid(id)) throw new Error("Invalid id");
  await AdminBlockModel.findByIdAndDelete(id).exec();
}

export async function getAdminBlocksInRange(
  from: Date,
  to: Date,
): Promise<SerializedAdminBlock[]> {
  await connectMongoose();
  const docs = await AdminBlockModel.find({
    startDate: { $lt: to },
    endDate: { $gt: from },
  })
    .sort({ startDate: 1 })
    .exec();
  return docs.map(serialize);
}
