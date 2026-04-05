import { type RuntimeCallbacks, runMockAgentTurn } from "@/lib/agent-runtime";
import { handleError } from "@/lib/error-handler";
import {
	type ChatMessage,
	type ChatSession,
	ChatSessionSchema,
	type ChatSessionSummary,
	type Messages,
	type Sessions,
} from "@/types";
import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

const CHAT_SESSION_KEY = "agent-dashboard:agent-sessions";

const queryKeys = {
	session: (sessionId?: string) => ["chatSession", sessionId],
	sessions: ["allSessions"],
};

const createId = () =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createMessage = (
	role: ChatMessage["role"],
	content: string,
	toolEventIds: string[] = [],
): ChatMessage => ({
	id: createId(),
	role,
	content,
	createdAt: Date.now(),
	toolEventIds,
});

const createDemoSession = (): ChatSession => ({
	id: "demo-agent-session",
	title: "Search chatgpt.com",
	updatedAt: Date.now(),
	lastMessagePreview: "Agent stream prepared with a demo VNC sandbox.",
	vncUrl: "https://8080-demo-agent.e2b.dev",
	events: [],
	messages: [
		createMessage(
			"assistant",
			"Describe a task and I will orchestrate a browser sandbox.",
		),
	],
});

const canUseStorage = () => typeof window !== "undefined";

const buildSessionSummary = (session: ChatSession): ChatSessionSummary => ({
	id: session.id,
	title: session.title,
	updatedAt: session.updatedAt,
	lastMessagePreview: session.lastMessagePreview,
	vncUrl: session.vncUrl,
	messageCount: session.messages.length,
	eventCount: session.events.length,
});

const readSessionsFromStorage = (): ChatSession[] => {
	if (!canUseStorage()) {
		return [createDemoSession()];
	}

	const rawSessions = window.localStorage.getItem(CHAT_SESSION_KEY);

	if (!rawSessions) {
		const seededSessions = [createDemoSession()];
		window.localStorage.setItem(
			CHAT_SESSION_KEY,
			JSON.stringify(seededSessions),
		);
		return seededSessions;
	}

	try {
		const parsedSessions = JSON.parse(rawSessions) as unknown[];
		return parsedSessions
			.map((session) => ChatSessionSchema.parse(session))
			.sort((left, right) => right.updatedAt - left.updatedAt);
	} catch (error) {
		handleError(error, "Failed to read chat sessions");
		const fallbackSessions = [createDemoSession()];
		window.localStorage.setItem(
			CHAT_SESSION_KEY,
			JSON.stringify(fallbackSessions),
		);
		return fallbackSessions;
	}
};

const writeSessionsToStorage = (sessions: ChatSession[]) => {
	if (!canUseStorage()) {
		return;
	}

	window.localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(sessions));
};

const getAllSessions = async (): Promise<Sessions> =>
	readSessionsFromStorage().map(buildSessionSummary);

const getChatSession = async (
	sessionId: string | undefined,
): Promise<ChatSession | null> => {
	if (!sessionId) {
		return null;
	}

	return (
		readSessionsFromStorage().find((session) => session.id === sessionId) ??
		null
	);
};

const getChatHistory = async (sessionId: string): Promise<Messages> => {
	const session = await getChatSession(sessionId);
	return session?.messages ?? [];
};

const createSession = async (
	title = "New agent run",
): Promise<ChatSessionSummary> => {
	const session: ChatSession = {
		id: createId(),
		title,
		updatedAt: Date.now(),
		lastMessagePreview: "Ready for your next browser automation task.",
		vncUrl: null,
		events: [],
		messages: [
			createMessage(
				"assistant",
				"Tell me what to do in the browser and I will stream the sandbox state here.",
			),
		],
	};

	const sessions = [session, ...readSessionsFromStorage()];
	writeSessionsToStorage(sessions);

	return buildSessionSummary(session);
};

const updateSessionTitle = async (
	sessionId: string,
	title: string,
): Promise<void> => {
	try {
		const sessions = readSessionsFromStorage().map((session) =>
			session.id === sessionId
				? {
						...session,
						title,
						updatedAt: Date.now(),
					}
				: session,
		);

		writeSessionsToStorage(sessions);
	} catch (error) {
		handleError(error);
		throw error;
	}
};

const deleteSession = async (sessionId: string): Promise<void> => {
	try {
		const sessions = readSessionsFromStorage().filter(
			(session) => session.id !== sessionId,
		);

		writeSessionsToStorage(
			sessions.length > 0 ? sessions : [createDemoSession()],
		);
	} catch (error) {
		handleError(error);
		throw error;
	}
};

type SendMessageParams = {
	sessionId?: string;
	prompt: string;
	runtimeCallbacks?: RuntimeCallbacks;
};

const sendMessage = async ({
	sessionId,
	prompt,
	runtimeCallbacks,
}: SendMessageParams): Promise<ChatSession> => {
	const sessions = readSessionsFromStorage();
	const existingSession = sessionId
		? sessions.find((session) => session.id === sessionId)
		: undefined;
	const session =
		existingSession ??
		({
			id: createId(),
			title: prompt.slice(0, 48) || "New agent run",
			updatedAt: Date.now(),
			lastMessagePreview: "",
			vncUrl: null,
			events: [],
			messages: [],
		} satisfies ChatSession);

	const userMessage = createMessage("user", prompt);
	session.messages = [...session.messages, userMessage];
	session.updatedAt = userMessage.createdAt;
	session.lastMessagePreview = prompt;

	const assistantResult = await runMockAgentTurn(prompt, {
		...runtimeCallbacks,
		onToolEvent: (event) => {
			session.events = [
				...session.events.filter(
					(currentEvent) => currentEvent.id !== event.id,
				),
				event,
			].sort((left, right) => left.timestamp - right.timestamp);
			runtimeCallbacks?.onToolEvent?.(event);
		},
		onVncUrl: (url) => {
			session.vncUrl = url;
			runtimeCallbacks?.onVncUrl?.(url);
		},
	});

	const assistantMessage = createMessage(
		"assistant",
		assistantResult.assistantMessage,
		assistantResult.eventIds,
	);

	session.messages = [...session.messages, assistantMessage];
	session.updatedAt = assistantMessage.createdAt;
	session.lastMessagePreview = assistantMessage.content;
	session.vncUrl = assistantResult.sandbox.vncUrl;

	const nextSessions = [
		session,
		...sessions.filter((currentSession) => currentSession.id !== session.id),
	];

	writeSessionsToStorage(nextSessions);

	return session;
};

const useChatSession = (
	sessionId: string | undefined,
): UseQueryResult<ChatSession | null, Error> =>
	useQuery({
		queryKey: queryKeys.session(sessionId),
		queryFn: () => getChatSession(sessionId),
		enabled: !!sessionId,
	});

const useChatHistory = (
	sessionId: string | undefined,
	shouldFetch = true,
): UseQueryResult<Messages, Error> =>
	useQuery({
		queryKey: ["chatHistory", sessionId],
		queryFn: () => {
			if (!sessionId) {
				return Promise.reject(new Error("Session ID is required"));
			}
			return getChatHistory(sessionId);
		},
		enabled: !!sessionId && shouldFetch,
	});

const useAllSessions = (): UseQueryResult<Sessions, Error> =>
	useQuery({
		queryKey: queryKeys.sessions,
		queryFn: getAllSessions,
	});

const useCreateSession = (): UseMutationResult<
	ChatSessionSummary,
	Error,
	string | undefined
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (title) => createSession(title),
		onSuccess: async (session) => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
			await queryClient.invalidateQueries({
				queryKey: queryKeys.session(session.id),
			});
		},
	});
};

const useUpdateSessionTitle = (): UseMutationResult<
	void,
	Error,
	{ sessionId: string; title: string }
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ sessionId, title }) => updateSessionTitle(sessionId, title),
		onSuccess: async (_, variables) => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
			await queryClient.invalidateQueries({
				queryKey: queryKeys.session(variables.sessionId),
			});
		},
	});
};

const useDeleteSession = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteSession,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
		},
	});
};

const useSendMessage = (): UseMutationResult<
	ChatSession,
	Error,
	SendMessageParams
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: sendMessage,
		onSuccess: async (session) => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.sessions });
			await queryClient.invalidateQueries({
				queryKey: queryKeys.session(session.id),
			});
		},
		onError: (error) => {
			handleError(error, "Failed to execute agent task");
		},
	});
};

export {
	createSession,
	deleteSession,
	getAllSessions,
	getChatHistory,
	getChatSession,
	sendMessage,
	updateSessionTitle,
	useAllSessions,
	useChatHistory,
	useChatSession,
	useCreateSession,
	useDeleteSession,
	useSendMessage,
	useUpdateSessionTitle,
};
