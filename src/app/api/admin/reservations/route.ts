import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError, jsonError } from "@/lib/api/responses";
import { listReservations } from "@/lib/services/reservation.service";
import { reservationStatusSchema } from "@/lib/validators/reservation.schema";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (session?.user?.role !== "admin") {
      return jsonError("Admin access required", 403);
    }

    const statusParam = request.nextUrl.searchParams.get("status");
    const status = statusParam
      ? reservationStatusSchema.parse(statusParam)
      : undefined;
    const reservations = await listReservations({ status });

    return NextResponse.json({ reservations });
  } catch (error) {
    return handleRouteError(error);
  }
}
