import { userAtom } from "@/atoms";
import {
	type SessionRow,
	createSession,
	deleteSession,
	getAllSessions,
	getMessages,
	saveMessages,
	updateSessionTitle,
} from "@/lib/indexeddb/chat";
import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { useAtomValue } from "jotai";

const useChatStorageUserId = () => {
	const { id } = useAtomValue(userAtom);
	return id;
};

const getRequiredUserId = (userId: string) => {
	if (!userId) {
		throw new Error("User is not authenticated");
	}

	return userId;
};

const useAllSessions = (): UseQueryResult<SessionRow[], Error> => {
	const userId = useChatStorageUserId();

	return useQuery({
		queryKey: ["allSessions", userId],
		queryFn: () => getAllSessions(userId),
		enabled: !!userId,
		staleTime: 1000,
	});
};

const useChatHistory = (
	sessionId: string,
): UseQueryResult<UIMessage[], Error> => {
	const userId = useChatStorageUserId();

	return useQuery({
		queryKey: ["chatHistory", userId, sessionId],
		queryFn: () => getMessages(sessionId, userId),
		enabled: !!sessionId && !!userId,
		staleTime: 1000,
	});
};

const useCreateSession = (): UseMutationResult<
	SessionRow,
	Error,
	{ id: string; title: string }
> => {
	const userId = useChatStorageUserId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, title }) =>
			createSession(id, title, getRequiredUserId(userId)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["allSessions", userId] });
		},
	});
};

const useUpdateSessionTitle = (): UseMutationResult<
	void,
	Error,
	{ sessionId: string; title: string }
> => {
	const userId = useChatStorageUserId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ sessionId, title }) =>
			updateSessionTitle(sessionId, title, getRequiredUserId(userId)),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["allSessions", userId] });
		},
	});
};

const useDeleteSession = (): UseMutationResult<void, Error, string> => {
	const userId = useChatStorageUserId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (sessionId) =>
			deleteSession(sessionId, getRequiredUserId(userId)),
		onSuccess: (_data, sessionId) => {
			queryClient.invalidateQueries({ queryKey: ["allSessions", userId] });
			queryClient.removeQueries({
				queryKey: ["chatHistory", userId, sessionId],
			});
		},
	});
};

const useSaveMessages = (): UseMutationResult<
	void,
	Error,
	{ messages: UIMessage[]; sessionId: string }
> => {
	const userId = useChatStorageUserId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ messages, sessionId }) =>
			saveMessages(messages, sessionId, getRequiredUserId(userId)),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["chatHistory", userId, variables.sessionId],
			});
			queryClient.invalidateQueries({ queryKey: ["allSessions", userId] });
		},
	});
};

export {
	useAllSessions,
	useChatHistory,
	useCreateSession,
	useUpdateSessionTitle,
	useDeleteSession,
	useSaveMessages,
};
