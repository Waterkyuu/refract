"use client";

import { Badge } from "@/components/ui/badge";
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
import { memo, useMemo, useState } from "react";

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

const AssistantMessage = memo(
	({ message, thinkingTime, onShowVnc }: AssistantMessageProps) => {
		const t = useTranslations("message");

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

		return (
			<div className="flex justify-start gap-3 px-4 py-3">
				<div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
					<Bot className="size-3.5" />
				</div>

				<div className="min-w-0 max-w-[80%] space-y-1">
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
								className="flex items-center justify-center rounded-2xl bg-muted px-4 py-2.5 text-xs sm:text-sm"
							>
								<p className="flex items-center justify-center break-words">
									{textPart.text}
								</p>
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

					{thinkingTime != null && textParts.length > 0 && (
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
