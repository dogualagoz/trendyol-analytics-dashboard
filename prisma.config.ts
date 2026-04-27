import * as dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// .env.local önce yüklenir, .env varsa üzerine yazar
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
