"use client";

import jotaiStore, { logoutAtom, userAtom } from "@/atoms";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth/client";
import type { User } from "@/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

const queryClient = new QueryClient();

const AppProviders = ({ children }: { children: React.ReactNode }) => {
	const { data: session } = authClient.useSession();

	useEffect(() => {
		if (session?.user) {
			const { id, name, email, image, createdAt, updatedAt } = session.user;
			const user: User = {
				id,
				userName: name,
				email,
				avatar: image || null,
				createdAt: new Date(createdAt).toISOString(),
				updatedAt: new Date(updatedAt).toISOString(),
			};
			jotaiStore.set(userAtom, user);
			return;
		}

		jotaiStore.set(logoutAtom);
	}, [session]);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			<Toaster richColors />
		</QueryClientProvider>
	);
};

export { AppProviders };
