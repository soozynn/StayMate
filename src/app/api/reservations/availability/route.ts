import { NextRequest, NextResponse } from "next/server";

import { handleRouteError } from "@/lib/api/responses";
import { getBlockedRanges } from "@/lib/services/availability.service";
import { availabilityQuerySchema } from "@/lib/validators/reservation.schema";

export async function GET(request: NextRequest) {
  try {
    const query = availabilityQuerySchema.parse({
      from: request.nextUrl.searchParams.get("from"),
      to: request.nextUrl.searchParams.get("to"),
    });
    const blockedRanges = await getBlockedRanges(query.from, query.to);

    return NextResponse.json({ blockedRanges });
  } catch (error) {
    return handleRouteError(error);
  }
}
