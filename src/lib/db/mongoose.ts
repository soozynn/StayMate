import mongoose from "mongoose";

import { getServerEnv } from "@/lib/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

export async function connectMongoose(): Promise<typeof mongoose> {
  // 연결이 완전히 끊긴 경우(disconnected) 캐시를 버리고 새로 연결
  if (
    cached.conn &&
    cached.conn.connection.readyState === mongoose.ConnectionStates.disconnected
  ) {
    cached.conn = null;
    cached.promise = null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const { MONGODB_URI, MONGODB_DB } = getServerEnv();

    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB,
      bufferCommands: false,
      // 유휴 소켓을 오래 유지하고, 서버 상태를 주기적으로 확인
      heartbeatFrequencyMS: 10_000,
      maxIdleTimeMS: 0,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // 실패한 연결 시도를 캐시에 남겨두면 이후 요청이 모두 같은 에러로 실패하므로 초기화
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
