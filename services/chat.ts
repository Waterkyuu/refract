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

const useAllSessions = (): UseQueryResult<SessionRow[], Error> => {
	return useQuery({
		queryKey: ["allSessions"],
		queryFn: getAllSessions,
		staleTime: 1000,
	});
};

const useChatHistory = (
	sessionId: string,
): UseQueryResult<UIMessage[], Error> => {
	return useQuery({
		queryKey: ["chatHistory", sessionId],
		queryFn: () => getMessages(sessionId),
		enabled: !!sessionId,
		staleTime: 1000,
	});
};

const useCreateSession = (): UseMutationResult<
	SessionRow,
	Error,
	{ id: string; title: string }
> => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, title }) => createSession(id, title),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["allSessions"] });
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
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["allSessions"] });
		},
	});
};

const useDeleteSession = (): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteSession,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["allSessions"] });
		},
	});
};

const useSaveMessages = (): UseMutationResult<
	void,
	Error,
	{ messages: UIMessage[]; sessionId: string }
> => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ messages, sessionId }) => saveMessages(messages, sessionId),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["chatHistory", variables.sessionId],
			});
			queryClient.invalidateQueries({ queryKey: ["allSessions"] });
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
