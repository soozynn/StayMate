import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError, jsonError } from "@/lib/api/responses";
import { listReservations } from "@/lib/services/reservation.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return jsonError("Authentication required", 401);
    }

    const reservations = await listReservations({
      userId: session.user.id,
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    return handleRouteError(error);
  }
}
