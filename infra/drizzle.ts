import { neonPool } from "@/infra/neon";
import { learnMemories } from "@/infra/schema/learn-memories";
import { drizzle } from "drizzle-orm/neon-serverless";

const schema = {
	learnMemories,
};

const db = drizzle({ client: neonPool, schema });

export { db, schema };
