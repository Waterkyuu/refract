"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import {
	Bot,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	Loader2,
	Wrench,
	XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useDeferredValue, useMemo, useState } from "react";
import Markdown from "react-markdown";

type AssistantMessageProps = {
	message: UIMessage;
	thinkingTime: number | null;
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
			<p className="whitespace-pre-wrap break-words text-[10px] text-amber-800 sm:text-xs">
				{text}
			</p>
		</div>
	);
});

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
		const [isExpanded, setIsExpanded] = useState(false);
		const toolName =
			typeof part.type === "string" ? part.type.slice(5) : "unknown";
		const state = part.state as string;
		const input = part.input as Record<string, unknown> | undefined;
		const output = part.output as Record<string, unknown> | undefined;
		const errorText = part.errorText as string | undefined;
		const hasDetails = Boolean(input || output || errorText);

		const stateIconMap: Record<string, React.ReactNode> = {
			"input-streaming": (
				<Loader2 className="size-3 animate-spin text-blue-500" />
			),
			"input-available": (
				<Loader2 className="size-3 animate-spin text-blue-500" />
			),
			"output-available": <CheckCircle2 className="size-3 text-green-500" />,
			"output-error": <XCircle className="size-3 text-red-500" />,
		};

		const stateLabelMap: Record<string, string> = {
			"input-streaming": t("toolRunning"),
			"input-available": t("toolPreparing"),
			"output-available": t("toolCompleted"),
			"output-error": t("toolFailed"),
		};

		const stateIcon = (state && stateIconMap[state]) ?? (
			<Wrench className="size-3 text-muted-foreground" />
		);

		const stateLabel = (state && stateLabelMap[state]) ?? t("toolUnknown");

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
					<div className="ml-auto flex items-center gap-1">
						{isCreateSandbox && onShowVnc && (
							<button
								type="button"
								className="rounded-md bg-primary px-2 py-0.5 text-[9px] text-primary-foreground transition-colors duration-200 hover:bg-primary/90 sm:text-[10px]"
								onClick={onShowVnc}
							>
								{tChat("viewSandbox")}
							</button>
						)}
						{hasDetails && (
							<button
								type="button"
								aria-label={
									isExpanded ? t("hideToolDetails") : t("showToolDetails")
								}
								className="rounded-md p-1 text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground"
								onClick={() => setIsExpanded((prev) => !prev)}
							>
								{isExpanded ? (
									<ChevronUp className="size-3.5" />
								) : (
									<ChevronDown className="size-3.5" />
								)}
							</button>
						)}
					</div>
				</div>
				{isExpanded && (
					<>
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
					</>
				)}
			</div>
		);
	},
);

const TextBlock = memo(({ text }: { text: string }) => {
	const deferredText = useDeferredValue(text);

	return (
		<div className="min-w-0 max-w-full overflow-hidden rounded-2xl bg-muted px-4 py-2.5 text-xs sm:text-sm">
			<div className="prose prose-sm max-w-full prose-pre:max-w-full prose-pre:overflow-x-auto break-words prose-headings:break-words prose-li:break-words prose-p:break-words prose-code:break-all">
				<Markdown
					components={{
						code: ({ className, ...props }) => (
							<code
								{...props}
								className={cn("whitespace-pre-wrap break-all", className)}
							/>
						),
						pre: ({ children, ...props }) => (
							<pre
								{...props}
								className="max-w-full overflow-x-auto whitespace-pre-wrap break-words"
							>
								{children}
							</pre>
						),
						table: ({ children, ...props }) => (
							<div className="max-w-full overflow-x-auto">
								<table {...props}>{children}</table>
							</div>
						),
					}}
				>
					{deferredText}
				</Markdown>
			</div>
		</div>
	);
});

const isTextPart = (
	p: Record<string, unknown>,
): p is { type: "text"; text: string } => p.type === "text";

const isReasoningPart = (
	p: Record<string, unknown>,
): p is { type: "reasoning"; text: string } => p.type === "reasoning";

const isToolPart = (p: Record<string, unknown>): boolean =>
	typeof p.type === "string" && p.type.startsWith("tool-");

const AssistantMessage = memo(
	({ message, thinkingTime, onShowVnc }: AssistantMessageProps) => {
		const t = useTranslations("message");

		const renderableParts = useMemo(
			() =>
				message.parts.filter(
					(p) => p.type !== "step-start",
				) as unknown as Record<string, unknown>[],
			[message.parts],
		);

		const hasText = renderableParts.some(
			(p) => p.type === "text" && (p as { text: string }).text,
		);

		return (
			<div className="flex justify-start gap-3 px-4 py-3">
				<div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
					<Bot className="size-3.5" />
				</div>

				<div className="min-w-0 max-w-[min(80%,42rem)] space-y-1">
					{renderableParts.map((part, i) => {
						if (isReasoningPart(part)) {
							return <ReasoningBlock key={i} text={part.text} />;
						}

						if (isTextPart(part)) {
							if (!part.text) return null;
							return <TextBlock key={i} text={part.text} />;
						}

						if (isToolPart(part)) {
							return (
								<ToolCallBlock key={i} part={part} onShowVnc={onShowVnc} />
							);
						}

						return null;
					})}

					{thinkingTime != null && hasText && (
						<p className="text-[9px] text-muted-foreground sm:text-[10px]">
							{t("thoughtFor", { time: thinkingTime.toFixed(1) })}
						</p>
					)}
				</div>
			</div>
		);
	},
);

export default AssistantMessage;
