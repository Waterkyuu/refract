import { neonPool } from "@/infra/neon";
import { drizzle } from "drizzle-orm/neon-serverless";

const db = drizzle({ client: neonPool });

export { db };
