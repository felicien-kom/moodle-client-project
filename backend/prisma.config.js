import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrate: {
    adapter: () => new PrismaLibSql({ url: process.env.DATABASE_URL }),
  },
});