import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "$lib/prisma/client";
import { env } from "$env/dynamic/private";

const url = env.DATABASE_URL ?? "file:./dev.db"
const adapter = new PrismaBetterSqlite3({ url: url });
const db = new PrismaClient({ adapter });

export default db;
