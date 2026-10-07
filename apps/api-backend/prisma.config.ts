import { defineConfig } from "prisma/config";

// DIRECT_URL (falls back to DATABASE_URL) is a non-pooled connection (Supabase port 5432) used only by the CLI for migrations.
// The running app uses DATABASE_URL (pooled) through the pg driver adapter.
try {
  process.loadEnvFile();
} catch {
  // no .env file present (e.g. in prod where vars are set directly)
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" },
});
