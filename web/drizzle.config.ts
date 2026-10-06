import { defineConfig } from "drizzle-kit";

// Sin dependencias: Node 21.7+ trae loadEnvFile. DRIZZLE_URL permite apuntar a
// una rama de prueba de Neon sin tocar el .env (así nunca se empuja por error
// contra producción cuando se está probando).
if (!process.env.DRIZZLE_URL && !process.env.DATABASE_URL) process.loadEnvFile(".env");

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  // DRIZZLE_OUT permite hacer la prueba en seco (pull + generate) en una carpeta temporal
  out: process.env.DRIZZLE_OUT || "./db/drizzle",
  dbCredentials: { url: process.env.DRIZZLE_URL || process.env.DATABASE_URL! },
});
