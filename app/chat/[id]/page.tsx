"use client";

import jotaiStore from "@/atoms";
import { firstUserInputAtom, vncUrlAtom } from "@/atoms/chat";
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
import useAgentChat from "@/hooks/use-chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAtomValue } from "jotai";
import { Monitor } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import DebugPanel from "../components/debug-panel";
import MessageArea from "../components/message-area";
import VncPanel from "../components/vnc-panel";

type ChatPageProps = {
	params: Promise<{ id: string }>;
};

const ChatPage = ({ params }: ChatPageProps) => {
	const [sessionId, setSessionId] = useState<string>("");
	const [vncSheetOpen, setVncSheetOpen] = useState(false);
	const firstInputSentRef = useRef(false);
	const isMobile = useIsMobile();
	const vncUrl = useAtomValue(vncUrlAtom);

	useEffect(() => {
		params.then((p) => setSessionId(p.id));
	}, [params]);

	const {
		messages,
		input,
		setInput,
		append,
		isLoading,
		stop,
		thinkingTime,
		status,
	} = useAgentChat({
		api: "/api/chat",
		sessionId,
	});

	useEffect(() => {
		if (firstInputSentRef.current) return;
		if (!sessionId) return;

		const firstInput = jotaiStore.get(firstUserInputAtom);
		if (firstInput) {
			firstInputSentRef.current = true;
			jotaiStore.set(firstUserInputAtom, "");
			append(firstInput);
		}
	}, [sessionId, append]);

	const handleShowVnc = useCallback(() => {
		if (isMobile) {
			setVncSheetOpen(true);
		}
	}, [isMobile]);

	const hasToolCalls = messages.some((msg) =>
		msg.parts.some(
			(p) => typeof p.type === "string" && p.type.startsWith("tool-"),
		),
	);

	const showVncButton = isMobile && vncUrl && hasToolCalls;

	return (
		<div className="flex h-screen w-screen flex-col">
			{isMobile ? (
				<div className="flex flex-1 flex-col overflow-hidden">
					<MessageArea
						messages={messages}
						thinkingTime={thinkingTime}
						className="flex-1"
						onShowVnc={handleShowVnc}
					/>
					<DebugPanel />
					<div className="flex w-full items-center justify-center border-t px-4 py-2">
						<InputField
							input={input}
							setInput={setInput}
							append={async (msg) => {
								await append(msg.content ?? "");
							}}
							isLoading={isLoading}
							stop={stop}
							size="md"
						/>
					</div>

					{showVncButton && (
						<button
							type="button"
							className="flex w-full items-center justify-center gap-2 border-t bg-primary/5 py-2 text-primary text-sm transition-colors duration-200 hover:bg-primary/10"
							onClick={() => setVncSheetOpen(true)}
						>
							<Monitor className="size-4" />
							View Sandbox
						</button>
					)}

					<Sheet open={vncSheetOpen} onOpenChange={setVncSheetOpen}>
						<SheetContent side="bottom" className="h-[70vh] p-0">
							<SheetHeader className="sr-only">
								<SheetTitle>Sandbox Viewer</SheetTitle>
							</SheetHeader>
							<VncPanel />
						</SheetContent>
					</Sheet>
				</div>
			) : (
				<ResizablePanelGroup
					orientation="horizontal"
					className="flex flex-1 overflow-hidden"
				>
					<ResizablePanel defaultSize="30%" maxSize="50%" minSize="30%">
						<div className="flex h-full w-full flex-col">
							<MessageArea messages={messages} thinkingTime={thinkingTime} />
							<div className="flex w-full items-center justify-center px-4 py-2">
								<InputField
									input={input}
									setInput={setInput}
									append={async (msg) => {
										await append(msg.content ?? "");
									}}
									isLoading={isLoading}
									stop={stop}
								/>
							</div>
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize="70%" minSize="50%" maxSize="70%">
						<VncPanel />
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</div>
	);
};

export default ChatPage;
