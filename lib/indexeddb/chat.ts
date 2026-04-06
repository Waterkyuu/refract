import type { UIMessage } from "ai";
import Dexie, { type EntityTable } from "dexie";

type SessionRow = {
	id: string;
	title: string;
	createdAt: number;
	updatedAt: number;
};

type MessageRow = {
	id: string;
	sessionId: string;
	role: string;
	parts: UIMessage["parts"];
	createdAt: number;
};

const db = new Dexie("firewave-agent") as Dexie & {
	sessions: EntityTable<SessionRow, "id">;
	messages: EntityTable<MessageRow, "id">;
};

db.version(1).stores({
	sessions: "id, updatedAt",
	messages: "id, sessionId, createdAt",
});

const createSession = async (id: string, title: string) => {
	const now = Date.now();
	await db.sessions.add({ id, title, createdAt: now, updatedAt: now });
	return { id, title, createdAt: now, updatedAt: now };
};

const getAllSessions = async (): Promise<SessionRow[]> => {
	return db.sessions.orderBy("updatedAt").reverse().toArray();
};

const getSession = async (id: string) => {
	return db.sessions.get(id);
};

const updateSessionTitle = async (id: string, title: string) => {
	await db.sessions.update(id, { title, updatedAt: Date.now() });
};

const deleteSession = async (id: string) => {
	await db.transaction("rw", [db.sessions, db.messages], async () => {
		await db.sessions.delete(id);
		await db.messages.where("sessionId").equals(id).delete();
	});
};

const saveMessages = async (messages: UIMessage[], sessionId: string) => {
	const rows: MessageRow[] = messages.map((msg) => ({
		id: msg.id,
		sessionId,
		role: msg.role,
		parts: msg.parts,
		createdAt: Date.now(),
	}));

	await db.transaction("rw", [db.messages, db.sessions], async () => {
		await db.messages.bulkPut(rows);
		await db.sessions.update(sessionId, { updatedAt: Date.now() });
	});
};

const getMessages = async (sessionId: string): Promise<UIMessage[]> => {
	const rows = await db.messages
		.where("sessionId")
		.equals(sessionId)
		.sortBy("createdAt");

	return rows.map((row) => ({
		id: row.id,
		role: row.role as UIMessage["role"],
		parts: row.parts,
	}));
};

export type { SessionRow, MessageRow };
export {
	createSession,
	getAllSessions,
	getSession,
	updateSessionTitle,
	deleteSession,
	saveMessages,
	getMessages,
};
