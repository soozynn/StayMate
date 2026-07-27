import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError, jsonError } from "@/lib/api/responses";
import {
  createManualReservation,
  listReservations,
} from "@/lib/services/reservation.service";
import {
  createManualReservationSchema,
  reservationStatusSchema,
} from "@/lib/validators/reservation.schema";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (session?.user?.role !== "admin") {
      return jsonError("Admin access required", 403);
    }

    const params = request.nextUrl.searchParams;
    const statusParam = params.get("status");
    const status = statusParam
      ? reservationStatusSchema.parse(statusParam)
      : undefined;
    const search = params.get("search") || undefined;
    const fromParam = params.get("from");
    const toParam = params.get("to");
    const from = fromParam ? new Date(fromParam) : undefined;
    const to = toParam ? new Date(toParam) : undefined;

    const reservations = await listReservations({ status, search, from, to });

    return NextResponse.json({ reservations });
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
    const input = createManualReservationSchema.parse(body);
    const reservation = await createManualReservation(input, {
      email: session.user.email,
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
