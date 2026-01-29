import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const basePrisma = new PrismaClient({ adapter });

// Extend Prisma Client with middleware using extensions
const prisma = basePrisma.$extends({
  name: "role-change-handler",
  query: {},
});

export { prisma };
