"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import {
	Bot,
	CheckCircle2,
	Clock,
	Loader2,
	User,
	Wrench,
	XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useMemo } from "react";

type MessageItemProps = {
	message: UIMessage;
	thinkingTime: number | null;
	hasToolCalls: boolean;
	onShowVnc?: () => void;
};

const ReasoningBlock = memo(({ text }: { text: string }) => {
	const t = useTranslations("message");

	return (
		<div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
			<div className="mb-1 flex items-center gap-1.5 font-medium text-[10px] text-amber-600 sm:text-xs">
				<Clock className="size-3" />
				{t("thinking")}
			</div>
			<p className="whitespace-pre-wrap text-[10px] text-amber-800 sm:text-xs">
				{text}
			</p>
		</div>
	);
});

ReasoningBlock.displayName = "ReasoningBlock";

const ToolCallBlock = memo(
	({
		part,
		onShowVnc,
	}: {
		part: Record<string, unknown>;
		onShowVnc?: () => void;
	}) => {
		const t = useTranslations("message");
		const tChat = useTranslations("chat");
		const toolName =
			typeof part.type === "string" ? part.type.slice(5) : "unknown";
		const state = part.state as string | undefined;
		const input = part.input as Record<string, unknown> | undefined;
		const output = part.output as Record<string, unknown> | undefined;
		const errorText = part.errorText as string | undefined;

		const stateIcon = useMemo(() => {
			if (state === "input-streaming" || state === "input-available") {
				return <Loader2 className="size-3 animate-spin text-blue-500" />;
			}
			if (state === "output-available") {
				return <CheckCircle2 className="size-3 text-green-500" />;
			}
			if (state === "output-error") {
				return <XCircle className="size-3 text-red-500" />;
			}
			return <Wrench className="size-3 text-muted-foreground" />;
		}, [state]);

		const stateLabel = useMemo(() => {
			if (state === "input-streaming") return t("toolRunning");
			if (state === "input-available") return t("toolPreparing");
			if (state === "output-available") return t("toolCompleted");
			if (state === "output-error") return t("toolFailed");
			return state ?? t("toolUnknown");
		}, [state, t]);

		const isCreateSandbox =
			toolName === "createSandbox" && state === "output-available";

		return (
			<div className="my-1.5 rounded-lg border bg-muted/40 p-2.5">
				<div className="flex items-center gap-2">
					{stateIcon}
					<span className="font-medium font-mono text-[10px] sm:text-xs">
						{toolName}
					</span>
					<Badge variant="secondary" className="text-[9px] sm:text-[10px]">
						{stateLabel}
					</Badge>
					{isCreateSandbox && onShowVnc && (
						<button
							type="button"
							className="ml-auto rounded-md bg-primary px-2 py-0.5 text-[9px] text-primary-foreground transition-colors duration-200 hover:bg-primary/90 sm:text-[10px]"
							onClick={onShowVnc}
						>
							{tChat("viewSandbox")}
						</button>
					)}
				</div>
				{input && (
					<pre className="mt-1.5 max-h-24 overflow-auto rounded bg-background p-1.5 font-mono text-[9px] sm:text-[10px]">
						{JSON.stringify(input, null, 2)}
					</pre>
				)}
				{output && state === "output-available" && (
					<pre className="mt-1.5 max-h-24 overflow-auto rounded bg-background p-1.5 font-mono text-[9px] sm:text-[10px]">
						{JSON.stringify(output, null, 2)}
					</pre>
				)}
				{errorText && (
					<p className="mt-1.5 text-[10px] text-red-500 sm:text-xs">
						{errorText}
					</p>
				)}
			</div>
		);
	},
);

ToolCallBlock.displayName = "ToolCallBlock";

const MessageItem = memo(
	({ message, thinkingTime, hasToolCalls, onShowVnc }: MessageItemProps) => {
		const t = useTranslations("message");
		const isUser = message.role === "user";
		const isAssistant = message.role === "assistant";

		const textParts = useMemo(
			() => message.parts.filter((p) => p.type === "text"),
			[message.parts],
		);

		const reasoningParts = useMemo(
			() => message.parts.filter((p) => p.type === "reasoning"),
			[message.parts],
		);

		const toolParts = useMemo(
			() =>
				message.parts.filter((p) =>
					typeof p.type === "string" ? p.type.startsWith("tool-") : false,
				),
			[message.parts],
		);

		const stepStartParts = useMemo(
			() => message.parts.filter((p) => p.type === "step-start"),
			[message.parts],
		);

		return (
			<div
				className={cn(
					"flex gap-3 px-4 py-3",
					isUser ? "justify-end" : "justify-start",
				)}
			>
				{isAssistant && (
					<div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
						<Bot className="size-3.5" />
					</div>
				)}

				<div
					className={cn(
						"max-w-[80%] space-y-1",
						isUser ? "order-first flex flex-col items-end" : "",
					)}
				>
					{stepStartParts.length > 0 &&
						stepStartParts.map((_, i) => (
							<div key={`step-${i}`} className="my-1 border-t border-dashed" />
						))}

					{reasoningParts.map((part, i) => (
						<ReasoningBlock
							key={`reasoning-${i}`}
							text={(part as { text: string }).text}
						/>
					))}

					{textParts.map((part, i) => {
						const textPart = part as { text: string };
						if (!textPart.text) return null;

						return (
							<div
								key={`text-${i}`}
								className={cn(
									"rounded-2xl px-4 py-2.5 text-xs leading-relaxed sm:text-sm",
									isUser ? "bg-primary text-primary-foreground" : "bg-muted",
								)}
							>
								<p className="whitespace-pre-wrap">{textPart.text}</p>
							</div>
						);
					})}

					{toolParts.map((part, i) => (
						<ToolCallBlock
							key={`tool-${i}`}
							part={part as Record<string, unknown>}
							onShowVnc={onShowVnc}
						/>
					))}

					{isAssistant && thinkingTime != null && textParts.length > 0 && (
						<p className="text-[9px] text-muted-foreground sm:text-[10px]">
							{t("thoughtFor", { time: thinkingTime.toFixed(1) })}
						</p>
					)}
				</div>

				{isUser && (
					<div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
						<User className="size-3.5 text-muted-foreground" />
					</div>
				)}
			</div>
		);
	},
);

MessageItem.displayName = "MessageItem";

export default MessageItem;
