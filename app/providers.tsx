"use client";

import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";

const queryClient = new QueryClient();

const AppProviders = ({ children }: { children: React.ReactNode }) => {
	return (
		<JotaiProvider>
			<QueryClientProvider client={queryClient}>
				{children}
				<Toaster richColors position="top-right" />
			</QueryClientProvider>
		</JotaiProvider>
	);
};

export { AppProviders };
