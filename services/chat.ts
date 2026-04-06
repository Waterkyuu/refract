import { handleError } from "@/lib/error-handler";
import { type Sessions, SessionsSchema } from "@/types/chat";
import {
	type UseMutationResult,
	type UseQueryResult,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { zodGet, zodPost } from "./request";

const EmptySchema = z.null();

const getAllSessions = async (): Promise<Sessions> => {
	try {
		return await zodGet("/message/get-sessions", SessionsSchema);
	} catch (error) {
		handleError(error);
		return [];
	}
};

const updateSessionTitle = async (
	sessionId: string,
	title: string,
): Promise<void> => {
	try {
		await zodPost(
			"/message/update-session-title",
			{ sessionId, title },
			EmptySchema,
		);
	} catch (error) {
		handleError(error);
		throw error;
	}
};

const deleteSession = async (sessionId: string): Promise<void> => {
	try {
		await zodPost(
			`/message/delete-single-session/${sessionId}`,
			{},
			EmptySchema,
		);
	} catch (error) {
		handleError(error);
		throw error;
	}
};

const useAllSessions = (): UseQueryResult<Sessions, Error> => {
	return useQuery({
		queryKey: ["allSessions"],
		queryFn: getAllSessions,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
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

export {
	getAllSessions,
	updateSessionTitle,
	deleteSession,
	useAllSessions,
	useUpdateSessionTitle,
	useDeleteSession,
};
