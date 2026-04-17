"use client";

import jotaiStore from "@/atoms";
import {
	firstUserInputAtom,
	pendingHomePromptAtom,
	pendingHomeUploadsAtom,
	showDatasetWorkspaceAtom,
	showFileWorkspaceAtom,
	vncUrlAtom,
	workspaceChartAtom,
	workspaceDatasetAtom,
	workspaceFileAtom,
} from "@/atoms/chat";
import Header from "@/components/share/header";
import InputField from "@/components/share/input-field";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import usePipelineChat from "@/hooks/use-pipeline-chat";
import {
	useChatHistory,
	useCreateSession,
	useSaveMessages,
} from "@/services/chat";
import type { ChatAttachment } from "@/types/chat";
import { useAtomValue } from "jotai";
import { Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import MessageArea from "../components/message-area";
import StepPanel from "../components/step-panel";
import WorkspacePanel from "../components/workspace-panel";

type ChatPageProps = {
	params: Promise<{ id: string }>;
};

const ChatPage = ({ params }: ChatPageProps) => {
	const [sessionId, setSessionId] = useState<string>("");
	const [vncSheetOpen, setVncSheetOpen] = useState(false);
	const [isInitialPipelinePending, setIsInitialPipelinePending] =
		useState(false);
	const firstInputSentRef = useRef(false);
	const sessionCreatedRef = useRef(false);
	const isMobile = useIsMobile();
	const vncUrl = useAtomValue(vncUrlAtom);
	const workspaceChart = useAtomValue(workspaceChartAtom);
	const workspaceDataset = useAtomValue(workspaceDatasetAtom);
	const workspaceFile = useAtomValue(workspaceFileAtom);
	const t = useTranslations("chat");

	useEffect(() => {
		params.then((p) => setSessionId(p.id));
	}, [params]);

	const { data: historyMessages = [], isLoading: historyLoading } =
		useChatHistory(sessionId);
	const { mutateAsync: createSession } = useCreateSession();
	const { mutate: saveMessages } = useSaveMessages();

	const hasHistory = historyMessages.length > 0;
	const initialMessages = hasHistory ? historyMessages : [];

	const onFinish = useCallback(
		(messages: Parameters<typeof saveMessages>[0]["messages"]) => {
			if (!sessionId) return;
			saveMessages({ messages, sessionId });
		},
		[saveMessages, sessionId],
	);

	const { messages, input, setInput, append, isLoading, stop, thinkingTime } =
		usePipelineChat({
			api: "/api/chat",
			sessionId,
			initialMessages,
			onFinish,
		});

	const hasPendingFirstInput =
		Boolean(jotaiStore.get(pendingHomePromptAtom)) || firstInputSentRef.current;
	const isHistoryHydrating =
		!!sessionId &&
		historyLoading &&
		messages.length === 0 &&
		!hasPendingFirstInput;

	useEffect(() => {
		if (firstInputSentRef.current) return;
		if (!sessionId) return;

		const firstInput = jotaiStore.get(pendingHomePromptAtom);
		const pendingHomeUploads = jotaiStore.get(pendingHomeUploadsAtom);
		if (firstInput) {
			firstInputSentRef.current = true;
			setIsInitialPipelinePending(true);
			jotaiStore.set(pendingHomePromptAtom, "");
			jotaiStore.set(firstUserInputAtom, "");
			jotaiStore.set(pendingHomeUploadsAtom, []);

			const title =
				firstInput.length > 50 ? `${firstInput.slice(0, 50)}...` : firstInput;

			if (!sessionCreatedRef.current) {
				sessionCreatedRef.current = true;
				createSession({ id: sessionId, title });
			}

			const firstDataset = pendingHomeUploads.find((file) => file.preview);
			if (firstDataset?.preview) {
				jotaiStore.set(showDatasetWorkspaceAtom, {
					fileId: firstDataset.fileId,
					filename: firstDataset.filename,
					preview: firstDataset.preview,
				});
			}

			void append(firstInput, {
				body: {
					fileIds: pendingHomeUploads.map((file) => file.fileId),
				},
				metadata: {
					attachments: pendingHomeUploads,
				},
			}).finally(() => {
				setIsInitialPipelinePending(false);
			});
		}
	}, [sessionId, append, createSession]);

	const handleShowVnc = useCallback(() => {
		if (isMobile) {
			setVncSheetOpen(true);
		}
	}, [isMobile]);

	const handleSelectAttachment = useCallback(
		(attachment: ChatAttachment) => {
			if (attachment.preview) {
				jotaiStore.set(showDatasetWorkspaceAtom, {
					fileId: attachment.fileId,
					filename: attachment.filename,
					preview: attachment.preview,
				});
			} else {
				jotaiStore.set(showFileWorkspaceAtom, {
					downloadUrl: `/api/file/${attachment.fileId}/download`,
					extension: attachment.extension,
					fileId: attachment.fileId,
					filename: attachment.filename,
					fileSize: attachment.fileSize,
				});
			}

			if (isMobile) {
				setVncSheetOpen(true);
			}
		},
		[isMobile],
	);

	const hasToolCalls = messages.some((msg) =>
		msg.parts.some(
			(p) => typeof p.type === "string" && p.type.startsWith("tool-"),
		),
	);

	const hasWorkspaceContent = Boolean(
		vncUrl || workspaceChart || workspaceDataset || workspaceFile,
	);
	const showVncButton =
		isMobile &&
		hasWorkspaceContent &&
		(hasToolCalls || Boolean(workspaceDataset));
	const showPendingStreamState = isLoading || isInitialPipelinePending;

	if (!sessionId) {
		return (
			<div className="flex h-screen w-screen items-center justify-center">
				<div className="text-muted-foreground text-xs sm:text-sm">
					{t("loading")}
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen w-screen flex-col">
			<Header />
			{isMobile ? (
				<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
					<MessageArea
						messages={messages}
						thinkingTime={thinkingTime}
						isLoading={showPendingStreamState}
						isHistoryLoading={isHistoryHydrating}
						className="min-h-0 flex-1"
						onSelectAttachment={handleSelectAttachment}
						onShowVnc={handleShowVnc}
					/>
					<StepPanel />
					<div className="flex w-full shrink-0 items-center justify-center border-t px-4 py-2">
						<InputField
							input={input}
							setInput={setInput}
							append={async (msg, options) => {
								const requestOptions = options as
									| {
											metadata?: Record<string, unknown>;
											requestBody?: Record<string, unknown>;
									  }
									| undefined;
								await append(msg.content ?? "", {
									body: requestOptions?.requestBody,
									metadata: requestOptions?.metadata,
								});
							}}
							isLoading={showPendingStreamState}
							onOpenWorkspace={() => setVncSheetOpen(true)}
							stop={stop}
							size="md"
						/>
					</div>

					{showVncButton && (
						<button
							type="button"
							className="flex w-full items-center justify-center gap-2 border-t bg-primary/5 py-2 text-primary text-xs transition-colors duration-200 hover:bg-primary/10 sm:text-sm"
							onClick={() => setVncSheetOpen(true)}
						>
							<Monitor className="size-4" />
							{t("viewSandbox")}
						</button>
					)}

					<Sheet open={vncSheetOpen} onOpenChange={setVncSheetOpen}>
						<SheetContent side="bottom" className="h-[70vh] p-0">
							<SheetHeader className="sr-only">
								<SheetTitle>{t("sandboxViewer")}</SheetTitle>
							</SheetHeader>
							<WorkspacePanel />
						</SheetContent>
					</Sheet>
				</div>
			) : (
				<ResizablePanelGroup
					orientation="horizontal"
					className="flex flex-1 overflow-hidden"
				>
					<ResizablePanel defaultSize="30%" maxSize="50%" minSize="30%">
						<div className="flex h-full min-h-0 w-full flex-col">
							<MessageArea
								messages={messages}
								thinkingTime={thinkingTime}
								isLoading={showPendingStreamState}
								isHistoryLoading={isHistoryHydrating}
								className="min-h-0 flex-1"
								onSelectAttachment={handleSelectAttachment}
							/>
							<StepPanel />
							<div className="flex w-full shrink-0 items-center justify-center px-4 py-2">
								<InputField
									input={input}
									setInput={setInput}
									append={async (msg, options) => {
										const requestOptions = options as
											| {
													metadata?: Record<string, unknown>;
													requestBody?: Record<string, unknown>;
											  }
											| undefined;
										await append(msg.content ?? "", {
											body: requestOptions?.requestBody,
											metadata: requestOptions?.metadata,
										});
									}}
									isLoading={showPendingStreamState}
									onOpenWorkspace={handleShowVnc}
									stop={stop}
								/>
							</div>
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize="70%" minSize="50%" maxSize="70%">
						<WorkspacePanel />
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</div>
	);
};

export default ChatPage;
