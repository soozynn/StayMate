import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError, jsonError } from "@/lib/api/responses";
import { updateStatus } from "@/lib/services/reservation.service";
import { updateReservationStatusSchema } from "@/lib/validators/reservation.schema";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (session?.user?.role !== "admin" || !session.user.email) {
      return jsonError("Admin access required", 403);
    }

    const body = await request.json();
    const input = updateReservationStatusSchema.parse({
      ...body,
      source: "admin",
      reviewedBy: session.user.email,
    });
    const { id } = await context.params;
    const reservation = await updateStatus(id, input.status, {
      source: input.source,
      reviewedBy: input.reviewedBy,
      adminNote: input.adminNote,
    });

    return NextResponse.json({ reservation });
  } catch (error) {
    return handleRouteError(error);
  }
}
