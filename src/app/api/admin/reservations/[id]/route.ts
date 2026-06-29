import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError, jsonError } from "@/lib/api/responses";
import { getReservationById } from "@/lib/services/reservation.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (session?.user?.role !== "admin") {
      return jsonError("Admin access required", 403);
    }

    const { id } = await context.params;
    const reservation = await getReservationById(id);

    return NextResponse.json({ reservation });
  } catch (error) {
    return handleRouteError(error);
  }
}
