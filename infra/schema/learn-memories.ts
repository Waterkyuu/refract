import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

const learnMemories = pgTable(
	"learn_memories",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		type: text("type").notNull(),
		title: text("title").notNull(),
		content: text("content").notNull(),
		usageCount: integer("usage_count").notNull().default(0),
		lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("learn_memories_type_updated_at_idx").on(table.type, table.updatedAt),
		uniqueIndex("learn_memories_type_title_idx").on(table.type, table.title),
	],
);

type LearnMemory = typeof learnMemories.$inferSelect;
type NewLearnMemory = typeof learnMemories.$inferInsert;

export { learnMemories };
export type { LearnMemory, NewLearnMemory };
