import type { UIMessage } from "ai";
import Dexie, { type EntityTable } from "dexie";

type SessionRow = {
	id: string;
	userId: string;
	title: string;
	createdAt: number;
	updatedAt: number;
};

type MessageRow = {
	id: string;
	userId: string;
	sessionId: string;
	role: string;
	parts: UIMessage["parts"];
	createdAt: number;
};

const MESSAGE_BATCH_PRECISION = 1000;
const CHAT_DB_NAME = "firewave-agent-v2";

const db = new Dexie(CHAT_DB_NAME) as Dexie & {
	sessions: EntityTable<SessionRow, "id">;
	messages: EntityTable<MessageRow, "id">;
};

db.version(1).stores({
	sessions: "id, userId, updatedAt, [userId+updatedAt]",
	messages: "id, userId, sessionId, createdAt, [userId+sessionId]",
});

const createSession = async (id: string, title: string, userId: string) => {
	const now = Date.now();
	await db.sessions.add({ id, userId, title, createdAt: now, updatedAt: now });
	return { id, userId, title, createdAt: now, updatedAt: now };
};

const getAllSessions = async (userId: string): Promise<SessionRow[]> => {
	const sessions = await db.sessions
		.where("userId")
		.equals(userId)
		.sortBy("updatedAt");
	return sessions.reverse();
};

const getSession = async (id: string, userId: string) => {
	const session = await db.sessions.get(id);
	return session?.userId === userId ? session : undefined;
};

const updateSessionTitle = async (
	id: string,
	title: string,
	userId: string,
) => {
	const session = await getSession(id, userId);
	if (!session) {
		return;
	}

	await db.sessions.update(id, { title, updatedAt: Date.now() });
};

const deleteSession = async (id: string, userId: string) => {
	await db.transaction("rw", [db.sessions, db.messages], async () => {
		const session = await getSession(id, userId);
		if (!session) {
			return;
		}

		await db.sessions.delete(id);
		await db.messages.where("[userId+sessionId]").equals([userId, id]).delete();
	});
};

const buildMessageRows = (
	messages: UIMessage[],
	sessionId: string,
	userId: string,
	batchTimestamp = Date.now(),
): MessageRow[] => {
	const batchBase = batchTimestamp * MESSAGE_BATCH_PRECISION;

	return messages.map((msg, index) => ({
		id: msg.id,
		userId,
		sessionId,
		role: msg.role,
		parts: msg.parts,
		createdAt: batchBase + index,
	}));
};

const saveMessages = async (
	messages: UIMessage[],
	sessionId: string,
	userId: string,
) => {
	const session = await getSession(sessionId, userId);
	if (!session) {
		return;
	}

	const rows = buildMessageRows(messages, sessionId, userId);

	await db.transaction("rw", [db.messages, db.sessions], async () => {
		await db.messages.bulkPut(rows);
		await db.sessions.update(sessionId, { updatedAt: Date.now() });
	});
};

const getMessages = async (
	sessionId: string,
	userId: string,
): Promise<UIMessage[]> => {
	const rows = await db.messages
		.where("[userId+sessionId]")
		.equals([userId, sessionId])
		.sortBy("createdAt");

	return rows.map((row) => ({
		id: row.id,
		role: row.role as UIMessage["role"],
		parts: row.parts,
	}));
};

export {
	type SessionRow,
	type MessageRow,
	createSession,
	getAllSessions,
	getSession,
	updateSessionTitle,
	deleteSession,
	buildMessageRows,
	saveMessages,
	getMessages,
};
