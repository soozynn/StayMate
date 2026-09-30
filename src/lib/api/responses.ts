import { after, NextResponse } from "next/server";
import { ZodError } from "zod";

import { reportError } from "@/lib/monitoring/discord";
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
  // 500으로 응답하는 예상 못한 에러는 Discord로 알림 (응답 지연 없이 응답 후 전송)
  after(() => reportError(error, { source: "api-route" }));

  return jsonError("Internal server error", 500);
}
