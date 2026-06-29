import { MongoClient } from "mongodb";

import { getServerEnv } from "@/lib/env";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise(): Promise<MongoClient> {
  const { MONGODB_URI } = getServerEnv();
  const client = new MongoClient(MONGODB_URI);
  return client.connect();
}

const clientPromise: Promise<MongoClient> =
  globalThis.mongoClientPromise ?? createClientPromise();

if (process.env.NODE_ENV !== "production") {
  globalThis.mongoClientPromise = clientPromise;
}

export function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}
