import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { handleRouteError, jsonError } from "@/lib/api/responses";
import { cancelReservation, getReservationById } from "@/lib/services/reservation.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return jsonError("Authentication required", 401);
    }

    const { id } = await context.params;
    const reservation = await getReservationById(id);

    if (
      session.user.role !== "admin" &&
      reservation.userId !== session.user.id
    ) {
      return jsonError("Forbidden", 403);
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return jsonError("Authentication required", 401);
    }

    const { id } = await context.params;
    const reservation = await cancelReservation(id, session.user.id);

    revalidatePath("/calendar");
    revalidatePath("/book");
    return NextResponse.json({ reservation });
  } catch (error) {
    return handleRouteError(error);
  }
}
