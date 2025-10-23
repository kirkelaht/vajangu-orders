import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/no-var-requires
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

