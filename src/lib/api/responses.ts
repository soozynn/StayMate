import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  getReservationServiceStatus,
  ReservationServiceError,
} from "@/lib/services/reservation.service";

export function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Invalid request", 400, error.flatten());
  }

  if (error instanceof ReservationServiceError) {
    return jsonError(error.message, getReservationServiceStatus(error), {
      code: error.code,
    });
  }

  console.error(error);

  return jsonError("Internal server error", 500);
}
