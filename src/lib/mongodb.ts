import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = global as typeof global & {
  mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.mongoose || {
  conn: null,
  promise: null,
};

globalWithMongoose.mongoose = cached;

export default async function connectDB(): Promise<typeof mongoose> {
  const MONGO_URI = process.env.MONGO_URI;
  // IMPORTANT: do not throw at module import time.
  // Some build environments evaluate server modules during build even if routes aren't invoked.
  if (!MONGO_URI) {
    throw new Error("Missing MONGO_URI in environment variables");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI!).then((mongooseInstance) => mongooseInstance);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
