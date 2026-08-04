import path from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env from project root
config({ path: path.join(__dirname, "..", ".env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default defineConfig({
  schema: path.join(__dirname, "schema.prisma"),
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
