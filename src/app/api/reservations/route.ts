import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { handleRouteError, jsonError } from "@/lib/api/responses";
import {
  createReservation,
  listReservations,
} from "@/lib/services/reservation.service";
import { createReservationSchema } from "@/lib/validators/reservation.schema";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return jsonError("Authentication required", 401);
    }

    const body = await request.json();
    const input = createReservationSchema.parse(body);
    const reservation = await createReservation({
      ...input,
      userId: session.user.id,
      guestEmail: input.guestEmail || session.user.email,
    });

    revalidatePath("/calendar");
    revalidatePath("/book");
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (session?.user?.role !== "admin") {
      return jsonError("Admin access required", 403);
    }

    const reservations = await listReservations();

    return NextResponse.json({ reservations });
  } catch (error) {
    return handleRouteError(error);
  }
}
