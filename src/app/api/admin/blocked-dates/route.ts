import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { handleRouteError, jsonError } from "@/lib/api/responses";
import { createAdminBlock, listAdminBlocks } from "@/lib/services/admin-block.service";

const createBlockSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
}).refine((v) => v.startDate < v.endDate, {
  message: "endDate must be after startDate",
  path: ["endDate"],
});

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") return jsonError("Admin access required", 403);

    const blocks = await listAdminBlocks();
    return NextResponse.json({ blocks });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin" || !session.user.email) {
      return jsonError("Admin access required", 403);
    }

    const body = await request.json();
    const input = createBlockSchema.parse(body);
    const block = await createAdminBlock({
      ...input,
      reason: input.reason || undefined,
      createdBy: session.user.email,
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
