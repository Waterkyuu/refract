"use client";

import { Clock3, PencilLine, Search, Trash2 } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeDate } from "@/lib/utils";
import type { ChatSessionSummary } from "@/types";

type AgentSidebarProps = {
	isOpen: boolean;
	onClose: () => void;
	sessions: ChatSessionSummary[];
	activeSessionId?: string;
	onSelectSession: (sessionId: string) => void;
	onCreateSession: () => void;
	onRenameSession: (session: ChatSessionSummary) => void;
	onDeleteSession: (session: ChatSessionSummary) => void;
};

const AgentSidebar = ({
	isOpen,
	onClose,
	sessions,
	activeSessionId,
	onSelectSession,
	onCreateSession,
	onRenameSession,
	onDeleteSession,
}: AgentSidebarProps) => {
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query);
	const normalizedQuery = deferredQuery.trim().toLowerCase();
	const filteredSessions = sessions.filter((session) => {
		if (!normalizedQuery) {
			return true;
		}

		return [session.title, session.lastMessagePreview].some((value) =>
			value.toLowerCase().includes(normalizedQuery),
		);
	});

	return (
		<>
			<div
				className={`fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm transition-opacity duration-200 xl:hidden ${
					isOpen
						? "pointer-events-auto opacity-100"
						: "pointer-events-none opacity-0"
				}`}
				onClick={onClose}
			/>

			<aside
				className={`fixed top-18 left-0 z-40 flex h-[calc(100vh-4.5rem)] w-[20rem] flex-col border-white/60 border-r bg-[#f5efe5]/95 backdrop-blur-xl transition-transform duration-200 xl:translate-x-0 ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="border-slate-200 border-b px-4 py-4">
					<Button
						className="mb-3 w-full transition-colors duration-200"
						onClick={onCreateSession}
						variant="default"
					>
						New Session
					</Button>
					<div className="relative">
						<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-slate-400" />
						<Input
							className="pl-9"
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search history"
							value={query}
						/>
					</div>
				</div>

				<ScrollArea className="flex-1 px-3 py-3">
					<div className="space-y-2">
						{filteredSessions.map((session) => {
							const isActive = session.id === activeSessionId;

							return (
								<button
									className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors duration-200 ${
										isActive
											? "border-slate-900 bg-slate-900 text-white"
											: "border-slate-200 bg-white/80 text-slate-900 hover:border-slate-300 hover:bg-white"
									}`}
									key={session.id}
									onClick={() => onSelectSession(session.id)}
									type="button"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium">{session.title}</p>
											<p
												className={`mt-1 line-clamp-2 text-sm ${
													isActive ? "text-slate-200" : "text-slate-500"
												}`}
											>
												{session.lastMessagePreview}
											</p>
										</div>

										<div className="flex shrink-0 items-center gap-1">
											<Button
												className="transition-colors duration-200"
												onClick={(event) => {
													event.stopPropagation();
													onRenameSession(session);
												}}
												size="icon-sm"
												type="button"
												variant={isActive ? "secondary" : "ghost"}
											>
												<PencilLine className="size-3.5" />
											</Button>
											<Button
												className="transition-colors duration-200"
												onClick={(event) => {
													event.stopPropagation();
													onDeleteSession(session);
												}}
												size="icon-sm"
												type="button"
												variant={isActive ? "secondary" : "ghost"}
											>
												<Trash2 className="size-3.5" />
											</Button>
										</div>
									</div>

									<div
										className={`mt-3 flex items-center gap-2 text-xs ${
											isActive ? "text-slate-300" : "text-slate-500"
										}`}
									>
										<Clock3 className="size-3.5" />
										<span>
											{formatRelativeDate(new Date(session.updatedAt))}
										</span>
										<span>?</span>
										<span>{session.eventCount} events</span>
									</div>
								</button>
							);
						})}

						{filteredSessions.length === 0 ? (
							<div className="rounded-2xl border border-slate-300 border-dashed bg-white/70 px-4 py-6 text-center text-slate-500 text-sm">
								No matching sessions yet.
							</div>
						) : null}
					</div>
				</ScrollArea>
			</aside>
		</>
	);
};

export { AgentSidebar };
