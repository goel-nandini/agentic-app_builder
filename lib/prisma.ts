import {PrismaPg} from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };      
function createPrismaClient() {
  const prisma = new PrismaPg({
    // You can configure your Prisma client here if needed
    connectionString: process.env.DATABASE_URL !,

  });

  return new PrismaClient({adapter});
}


export const db =  globalForPrisma.prisma ?? createPrismaClient();

if(process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;  