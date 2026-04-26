import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./infra/schema/*.ts",
	out: "./infra/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL ?? "",
	},
});
