import { NextRequest, NextResponse } from "next/server";

import { connectMongoose } from "@/lib/db/mongoose";

// 캐시 없이 매 요청마다 실제로 DB에 핑을 보낸다
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // CRON_SECRET이 없으면(로컬 개발 등) 인증 없이 허용
  if (!secret) {
    return true;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const mongoose = await connectMongoose();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("MongoDB connection has no database handle");
    }
    await db.admin().ping();

    return NextResponse.json({ ok: true, latencyMs: Date.now() - startedAt });
  } catch (error) {
    console.error("[db-ping] MongoDB ping failed", error);
    return NextResponse.json(
      { ok: false, latencyMs: Date.now() - startedAt },
      { status: 503 },
    );
  }
}
