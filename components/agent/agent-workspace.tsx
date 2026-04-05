"use client";

import { agentDispatchAtom, agentStateAtom } from "@/atoms";
import { AgentSidebar } from "@/components/agent/agent-sidebar";
import { DebugPanel } from "@/components/agent/debug-panel";
import { VncViewer } from "@/components/agent/vnc-viewer";
import { Header } from "@/components/share/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { handleError } from "@/lib/error-handler";
import { cn, formatRelativeDate } from "@/lib/utils";
import {
	useAllSessions,
	useChatSession,
	useCreateSession,
	useDeleteSession,
	useSendMessage,
	useUpdateSessionTitle,
} from "@/services/chat";
import type { ChatMessage, ChatSessionSummary } from "@/types";
import { useAtomValue, useSetAtom } from "jotai";
import {
	Bot,
	LoaderCircle,
	PanelRightOpen,
	SendHorizontal,
	Sparkles,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

const quickPrompts = [
	"Search chatgpt.com",
	"Open notion.so and summarize the landing page",
	"Search for the latest Vercel AI SDK docs",
];

const AgentWorkspace = () => {
	const [selectedSessionId, setSelectedSessionId] = useState<string>();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [debugOpen, setDebugOpen] = useState(true);
	const [mobileVncOpen, setMobileVncOpen] = useState(false);
	const [prompt, setPrompt] = useState("");
	const [isNavigating, startTransition] = useTransition();
	const isMobile = useIsMobile();
	const agentState = useAtomValue(agentStateAtom);
	const dispatch = useSetAtom(agentDispatchAtom);
	const sessionsQuery = useAllSessions();
	const selectedSessionQuery = useChatSession(selectedSessionId);
	const createSessionMutation = useCreateSession();
	const renameSessionMutation = useUpdateSessionTitle();
	const deleteSessionMutation = useDeleteSession();
	const sendMessageMutation = useSendMessage();

	useEffect(() => {
		if (
			!selectedSessionId &&
			sessionsQuery.data &&
			sessionsQuery.data.length > 0
		) {
			setSelectedSessionId(sessionsQuery.data[0].id);
		}
	}, [selectedSessionId, sessionsQuery.data]);

	useEffect(() => {
		const session = selectedSessionQuery.data;

		if (!session) {
			return;
		}

		dispatch({
			type: "hydrate",
			payload: {
				events: session.events,
				vncUrl: session.vncUrl,
				status: "idle",
			},
		});
	}, [dispatch, selectedSessionQuery.data]);

	const currentMessages = selectedSessionQuery.data?.messages ?? [];
	const hasActionInLatestAssistantTurn = [...currentMessages]
		.reverse()
		.find((message) => message.role === "assistant")?.toolEventIds.length;

	const handleCreateSession = async () => {
		try {
			const session = await createSessionMutation.mutateAsync("New agent run");
			startTransition(() => {
				setSelectedSessionId(session.id);
				setSidebarOpen(false);
			});
		} catch (error) {
			handleError(error);
		}
	};

	const handleRenameSession = async (session: ChatSessionSummary) => {
		const nextTitle = window.prompt("Rename session", session.title)?.trim();

		if (!nextTitle || nextTitle === session.title) {
			return;
		}

		try {
			await renameSessionMutation.mutateAsync({
				sessionId: session.id,
				title: nextTitle,
			});
		} catch (error) {
			handleError(error);
		}
	};

	const handleDeleteSession = async (session: ChatSessionSummary) => {
		const shouldDelete = window.confirm(
			`Delete "${session.title}" from the sidebar history?`,
		);

		if (!shouldDelete) {
			return;
		}

		try {
			await deleteSessionMutation.mutateAsync(session.id);

			if (session.id === selectedSessionId) {
				const nextSession = sessionsQuery.data?.find(
					(currentSession) => currentSession.id !== session.id,
				);
				setSelectedSessionId(nextSession?.id);
			}
		} catch (error) {
			handleError(error);
		}
	};

	const handleSendPrompt = async (nextPrompt?: string) => {
		const trimmedPrompt = (nextPrompt ?? prompt).trim();

		if (!trimmedPrompt) {
			return;
		}

		setPrompt("");
		setSidebarOpen(false);

		try {
			const session = await sendMessageMutation.mutateAsync({
				sessionId: selectedSessionId,
				prompt: trimmedPrompt,
				runtimeCallbacks: {
					onStatusChange: (status) =>
						dispatch({
							type: "set-status",
							payload: status,
						}),
					onToolEvent: (event) =>
						dispatch({
							type: "record-event",
							payload: event,
						}),
					onVncUrl: (url) =>
						dispatch({
							type: "set-vnc-url",
							payload: url,
						}),
				},
			});

			startTransition(() => {
				setSelectedSessionId(session.id);
			});
		} catch (error) {
			dispatch({
				type: "set-status",
				payload: "error",
			});
			handleError(error);
		}
	};

	const renderMessage = (message: ChatMessage) => {
		const isAssistant = message.role === "assistant";

		return (
			<div
				className={cn(
					"rounded-[1.5rem] border px-4 py-4 shadow-sm",
					isAssistant
						? "border-slate-200 bg-white"
						: "border-transparent bg-slate-950 text-white",
				)}
				key={message.id}
			>
				<div className="mb-3 flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"flex size-9 items-center justify-center rounded-full",
								isAssistant
									? "bg-amber-100 text-amber-700"
									: "bg-white/10 text-white",
							)}
						>
							{isAssistant ? (
								<Bot className="size-4" />
							) : (
								<Sparkles className="size-4" />
							)}
						</div>
						<div>
							<p className="font-medium capitalize">{message.role}</p>
							<p
								className={cn(
									"text-xs",
									isAssistant ? "text-slate-500" : "text-white/60",
								)}
							>
								{formatRelativeDate(new Date(message.createdAt))}
							</p>
						</div>
					</div>

					{isAssistant && message.toolEventIds.length > 0 ? (
						<Badge variant="outline">
							{message.toolEventIds.length} actions
						</Badge>
					) : null}
				</div>

				<p
					className={cn(
						"whitespace-pre-wrap text-sm leading-7",
						isAssistant ? "text-slate-700" : "text-white",
					)}
				>
					{message.content}
				</p>

				{isMobile && isAssistant && message.toolEventIds.length > 0 ? (
					<Button
						className="mt-4 transition-colors duration-200"
						onClick={() => setMobileVncOpen(true)}
						size="sm"
						variant="outline"
					>
						<PanelRightOpen className="size-4" />
						Open VNC Drawer
					</Button>
				) : null}
			</div>
		);
	};

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.15),_transparent_28%),linear-gradient(180deg,_#fffdf8_0%,_#f2eee6_50%,_#eef3f8_100%)]">
			<Header
				onHistoryClick={() => setSidebarOpen((currentValue) => !currentValue)}
				onNewChatClick={() => {
					void handleCreateSession();
				}}
			/>

			<AgentSidebar
				activeSessionId={selectedSessionId}
				isOpen={sidebarOpen || !isMobile}
				onClose={() => setSidebarOpen(false)}
				onCreateSession={() => {
					void handleCreateSession();
				}}
				onDeleteSession={(session) => {
					void handleDeleteSession(session);
				}}
				onRenameSession={(session) => {
					void handleRenameSession(session);
				}}
				onSelectSession={(sessionId) => {
					startTransition(() => {
						setSelectedSessionId(sessionId);
						setSidebarOpen(false);
					});
				}}
				sessions={sessionsQuery.data ?? []}
			/>

			<main className="px-4 pt-24 pb-6 transition-[padding] duration-200 md:px-6 xl:pl-[22rem]">
				<div className="mx-auto max-w-[1600px]">
					{isMobile ? (
						<section className="space-y-4">
							{isNavigating ? (
								<div className="flex items-center gap-2 text-slate-500 text-sm">
									<LoaderCircle className="size-4 animate-spin" />
									Switching sessions...
								</div>
							) : null}

							<div className="rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-amber-100/20 shadow-xl backdrop-blur-xl">
								<div className="mb-4 flex flex-wrap gap-2">
									{quickPrompts.map((quickPrompt) => (
										<Button
											className="transition-colors duration-200"
											key={quickPrompt}
											onClick={() => {
												void handleSendPrompt(quickPrompt);
											}}
											size="sm"
											variant="outline"
										>
											{quickPrompt}
										</Button>
									))}
								</div>

								<ScrollArea className="h-[52vh] pr-3">
									<div className="space-y-4">
										{currentMessages.map(renderMessage)}
									</div>
								</ScrollArea>

								<div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
									<Textarea
										onChange={(event) => setPrompt(event.target.value)}
										onKeyDown={(event) => {
											if (event.key === "Enter" && !event.shiftKey) {
												event.preventDefault();
												void handleSendPrompt();
											}
										}}
										placeholder="Ask the agent to browse, search, click, or summarize..."
										value={prompt}
									/>
									<div className="mt-3 flex items-center justify-between gap-3">
										<div className="flex items-center gap-2 text-slate-500 text-xs">
											<Badge variant="outline">{agentState.status}</Badge>
											<span>{agentState.events.length} events in pipeline</span>
										</div>
										<Button
											className="transition-colors duration-200"
											disabled={sendMessageMutation.isPending}
											onClick={() => {
												void handleSendPrompt();
											}}
										>
											{sendMessageMutation.isPending ? (
												<LoaderCircle className="size-4 animate-spin" />
											) : (
												<SendHorizontal className="size-4" />
											)}
											Send
										</Button>
									</div>
								</div>
							</div>

							<DebugPanel
								isOpen={debugOpen}
								onToggle={() => setDebugOpen((currentValue) => !currentValue)}
								state={agentState}
							/>
						</section>
					) : (
						<ResizablePanelGroup
							className="h-[calc(100vh-7.5rem)] rounded-[2rem] border border-white/60 bg-white/55 shadow-2xl shadow-slate-200/50 backdrop-blur-xl"
							orientation="horizontal"
						>
							<ResizablePanel defaultSize={45} minSize={34}>
								<section className="flex h-full flex-col p-4">
									<div className="mb-4 flex flex-wrap gap-2">
										{quickPrompts.map((quickPrompt) => (
											<Button
												className="transition-colors duration-200"
												key={quickPrompt}
												onClick={() => {
													void handleSendPrompt(quickPrompt);
												}}
												size="sm"
												variant="outline"
											>
												{quickPrompt}
											</Button>
										))}
									</div>

									<div className="min-h-0 flex-1 rounded-[1.75rem] border border-slate-200 bg-white/70 p-4">
										<ScrollArea className="h-full pr-3">
											<div className="space-y-4">
												{currentMessages.map(renderMessage)}
											</div>
										</ScrollArea>
									</div>

									<div className="mt-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/90 p-4">
										<Textarea
											onChange={(event) => setPrompt(event.target.value)}
											onKeyDown={(event) => {
												if (event.key === "Enter" && !event.shiftKey) {
													event.preventDefault();
													void handleSendPrompt();
												}
											}}
											placeholder="Ask the agent to browse, search, click, or summarize..."
											value={prompt}
										/>
										<div className="mt-3 flex items-center justify-between gap-3">
											<div className="flex items-center gap-2 text-slate-500 text-xs">
												<Badge variant="outline">{agentState.status}</Badge>
												<span>{agentState.events.length} events recorded</span>
											</div>
											<Button
												className="transition-colors duration-200"
												disabled={sendMessageMutation.isPending}
												onClick={() => {
													void handleSendPrompt();
												}}
											>
												{sendMessageMutation.isPending ? (
													<LoaderCircle className="size-4 animate-spin" />
												) : (
													<SendHorizontal className="size-4" />
												)}
												Send
											</Button>
										</div>
									</div>

									<div className="mt-4">
										<DebugPanel
											isOpen={debugOpen}
											onToggle={() =>
												setDebugOpen((currentValue) => !currentValue)
											}
											state={agentState}
										/>
									</div>
								</section>
							</ResizablePanel>

							<ResizableHandle withHandle />

							<ResizablePanel defaultSize={55} minSize={32}>
								<section className="flex h-full flex-col p-4">
									<div className="mb-4 flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-3">
										<div>
											<p className="font-medium text-slate-900">Live Sandbox</p>
											<p className="text-slate-500 text-sm">
												Desktop sandbox rendered from the E2B noVNC endpoint
											</p>
										</div>
										<div className="flex items-center gap-2">
											<Badge variant="outline">{agentState.status}</Badge>
											{selectedSessionQuery.data?.vncUrl ? (
												<Badge variant="secondary">Connected</Badge>
											) : (
												<Badge variant="outline">Standby</Badge>
											)}
										</div>
									</div>

									<div className="min-h-0 flex-1">
										<VncViewer className="h-full" url={agentState.vncUrl} />
									</div>
								</section>
							</ResizablePanel>
						</ResizablePanelGroup>
					)}
				</div>
			</main>

			<Sheet onOpenChange={setMobileVncOpen} open={mobileVncOpen}>
				<SheetContent
					className="h-[72vh] rounded-t-[2rem] border-x-0 border-b-0 bg-white px-0"
					side="bottom"
				>
					<SheetHeader className="px-5">
						<SheetTitle>Live VNC Stream</SheetTitle>
						<SheetDescription>
							The remote desktop opens for any assistant turn with browser
							actions.
						</SheetDescription>
					</SheetHeader>
					<div className="h-full px-5 pb-6">
						<VncViewer
							className="h-full"
							interactive
							url={hasActionInLatestAssistantTurn ? agentState.vncUrl : null}
						/>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
};

export { AgentWorkspace };
