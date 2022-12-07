import { Prisma, PrismaClient } from "@prisma/client";
import { env } from "~/env/server.mjs";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient<Prisma.PrismaClientOptions, 'info' | 'query' | 'warn' | 'error'> | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? [
            {
              emit: "event",
              level: "query",
            },
            {
              emit: "stdout",
              level: "error",
            },
            {
              emit: "stdout",
              level: "warn",
            },
          ]
        : ["error"],
  });

prisma.$on("query", (e: Prisma.QueryEvent) => {
  console.log("Query: " + '\u001b[' + 33 + 'm' + e.query + '\u001b[0m');
  console.log("Params: " + e.params);
  console.log('\u001b[' + 32 + 'm' + "Duration: " + e.duration + "ms" + '\u001b[0m');
});

if (env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
