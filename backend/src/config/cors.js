// src/config/cors.js
import cors from "cors";
import { env } from "./env.js";

const resolveOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (env.CORS_ORIGIN.includes("*")) return callback(null, true);

  const isAllowed = env.CORS_ORIGIN.some((allowed) => origin.startsWith(allowed));
  if (isAllowed) return callback(null, true);

  callback(new Error(`CORS: origin ${origin} not allowed`));
};

export const corsOptions = cors({
  origin: resolveOrigin,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});