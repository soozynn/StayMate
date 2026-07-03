import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError, jsonError } from "@/lib/api/responses";
import { deleteAdminBlock } from "@/lib/services/admin-block.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") return jsonError("Admin access required", 403);

    const { id } = await context.params;
    await deleteAdminBlock(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
