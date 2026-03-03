import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function parseDbUrl(url: string): { host: string; port: number; user: string; password: string; database: string } {
  try {
    const u = new URL(url);
    if (u.protocol !== "mysql:" && u.protocol !== "mariadb:") {
      throw new Error("Expected mysql: or mariadb: URL");
    }
    return {
      host: u.hostname || "localhost",
      port: u.port ? parseInt(u.port, 10) : 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname ? u.pathname.slice(1) : "",
    };
  } catch (e) {
    throw new Error(`Invalid DATABASE_URL: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const config = parseDbUrl(url);
  const adapter = new PrismaMariaDb(config);
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
