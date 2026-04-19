"use client";

import FileCard from "@/components/share/file-card";
import { Badge } from "@/components/ui/badge";
import {
	type WorkspaceRoundArtifact,
	type WorkspaceRoundArtifacts,
	deriveRoundArtifactsFromMessage,
	hasWorkspaceRoundArtifacts,
} from "@/lib/chat/workspace-hydration";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/types/chat";
import type { UIMessage } from "ai";
import {
	BarChart3,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock,
	Database,
	FileText,
	Loader2,
	Wrench,
	XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useDeferredValue, useEffect, useMemo, useState } from "react";
import Markdown, { type Components } from "react-markdown";

type AssistantMessageProps = {
	message: UIMessage;
	thinkingTime: number | null;
	onSelectAttachment?: (attachment: ChatAttachment) => void;
	onSelectRoundArtifact?: (artifact: WorkspaceRoundArtifact) => void;
	onShowVnc?: () => void;
};

const MESSAGE_COLLAPSE_TEXT_LIMIT = 1800;
const SANDBOX_LOCAL_PATH_PREFIXES = ["/home/user/"];

const isSandboxLocalPath = (value?: string | null) =>
	Boolean(
		value &&
			SANDBOX_LOCAL_PATH_PREFIXES.some((prefix) => value.startsWith(prefix)),
	);

const formatToolDetail = (value: unknown): string | undefined => {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (typeof value === "string") {
		const text = value.trim();
		return text.length > 0 ? text : undefined;
	}

	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
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
		const inputText = formatToolDetail(input);
		const outputText = formatToolDetail(output);
		const errorText = formatToolDetail(part.errorText);
		const hasDetails = Boolean(inputText || outputText || errorText);

		useEffect(() => {
			if (state === "output-error") {
				setIsExpanded(true);
			}
		}, [state]);

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
						{inputText && (
							<pre className="mt-1.5 max-h-24 overflow-auto rounded bg-background p-1.5 font-mono text-[9px] sm:text-[10px]">
								{inputText}
							</pre>
						)}
						{outputText && (
							<pre className="mt-1.5 max-h-24 overflow-auto rounded bg-background p-1.5 font-mono text-[9px] sm:text-[10px]">
								{outputText}
							</pre>
						)}
						{errorText && (
							<pre className="mt-1.5 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-red-50 p-1.5 font-mono text-[9px] text-red-600 sm:text-[10px]">
								{errorText}
							</pre>
						)}
					</>
				)}
			</div>
		);
	},
);

type TextMarkdownCodeProps = Parameters<NonNullable<Components["code"]>>[0];
type TextMarkdownPreProps = Parameters<NonNullable<Components["pre"]>>[0];
type TextMarkdownTableProps = Parameters<NonNullable<Components["table"]>>[0];
type TextMarkdownAnchorProps = Parameters<NonNullable<Components["a"]>>[0];
type TextMarkdownImageProps = Parameters<NonNullable<Components["img"]>>[0];

const TextMarkdownCode = ({ className, ...props }: TextMarkdownCodeProps) => (
	<code {...props} className={cn("whitespace-pre-wrap break-all", className)} />
);

const TextMarkdownPre = ({ children, ...props }: TextMarkdownPreProps) => (
	<pre
		{...props}
		className="max-w-full overflow-x-auto whitespace-pre-wrap break-words"
	>
		{children}
	</pre>
);

const TextMarkdownTable = ({ children, ...props }: TextMarkdownTableProps) => (
	<div className="max-w-full overflow-x-auto">
		<table {...props}>{children}</table>
	</div>
);

const TextMarkdownAnchor = ({
	children,
	href,
	...props
}: TextMarkdownAnchorProps) => {
	const stringHref = typeof href === "string" ? href : undefined;

	if (isSandboxLocalPath(stringHref)) {
		return (
			<code className="break-all rounded bg-background/70 px-1 py-0.5 text-[0.85em]">
				{stringHref}
			</code>
		);
	}

	return (
		<a {...props} href={stringHref}>
			{children}
		</a>
	);
};

const TextMarkdownImage = ({ alt, src, ...props }: TextMarkdownImageProps) => {
	const stringSrc = typeof src === "string" ? src : undefined;

	if (isSandboxLocalPath(stringSrc)) {
		return (
			<code className="break-all rounded bg-background/70 px-1 py-0.5 text-[0.85em]">
				{alt ? `${alt}: ${stringSrc}` : stringSrc}
			</code>
		);
	}

	return (
		<img
			{...props}
			alt={alt ?? ""}
			className="max-w-full rounded-lg"
			src={stringSrc}
		/>
	);
};

const TEXT_BLOCK_MARKDOWN_COMPONENTS: Components = {
	code: TextMarkdownCode,
	pre: TextMarkdownPre,
	table: TextMarkdownTable,
	a: TextMarkdownAnchor,
	img: TextMarkdownImage,
};

const TextBlockMarkdown = memo(({ text }: { text: string }) => {
	const deferredText = useDeferredValue(text);

	return (
		<div className="prose prose-sm max-w-full prose-pre:max-w-full prose-pre:overflow-x-auto break-words prose-headings:break-words prose-li:break-words prose-p:break-words prose-code:break-all">
			<Markdown components={TEXT_BLOCK_MARKDOWN_COMPONENTS}>
				{deferredText}
			</Markdown>
		</div>
	);
});

const TextBlock = memo(({ text }: { text: string }) => {
	const t = useTranslations("message");
	const [isExpanded, setIsExpanded] = useState(false);
	const shouldCollapse = text.length > MESSAGE_COLLAPSE_TEXT_LIMIT;

	useEffect(() => {
		setIsExpanded(false);
	}, [text]);

	return (
		<div className="relative">
			<div
				className={cn(
					"min-w-0 max-w-full overflow-hidden rounded-2xl py-2.5 text-xs sm:text-sm",
					shouldCollapse && !isExpanded && "max-h-96",
				)}
			>
				<TextBlockMarkdown text={text} />
			</div>

			{shouldCollapse && !isExpanded && (
				<div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end bg-gradient-to-t from-background via-background/95 to-transparent px-2 pt-10 pb-2">
					<button
						type="button"
						className="pointer-events-auto rounded-full border bg-background px-3 py-1.5 font-medium text-[10px] text-foreground shadow-sm transition-colors duration-200 hover:bg-muted sm:text-xs"
						onClick={() => setIsExpanded(true)}
					>
						{t("showMore")}
					</button>
				</div>
			)}

			{shouldCollapse && isExpanded && (
				<div className="flex justify-end px-2 pt-2">
					<button
						type="button"
						className="rounded-full border bg-background px-3 py-1.5 font-medium text-[10px] text-foreground shadow-sm transition-colors duration-200 hover:bg-muted sm:text-xs"
						onClick={() => setIsExpanded(false)}
					>
						{t("showLess")}
					</button>
				</div>
			)}
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

const isArtifactPart = (
	p: Record<string, unknown>,
): p is {
	type: "artifact";
	fileId: string;
	filename: string;
	extension: string;
} => p.type === "artifact" && "fileId" in p && "filename" in p;

const AssistantMessage = memo(
	({
		message,
		thinkingTime,
		onSelectAttachment,
		onSelectRoundArtifact,
		onShowVnc,
	}: AssistantMessageProps) => {
		const t = useTranslations("message");
		const [expandedRoundCategory, setExpandedRoundCategory] = useState<
			"data" | "chart" | "report" | null
		>(null);

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

		const roundArtifacts = useMemo<WorkspaceRoundArtifacts>(
			() => deriveRoundArtifactsFromMessage(message),
			[message],
		);
		const hasRoundArtifacts = hasWorkspaceRoundArtifacts(roundArtifacts);

		const roundButtons = useMemo(
			() =>
				[
					{
						category: "data" as const,
						items: roundArtifacts.data,
						icon: Database,
						label: "Data",
					},
					{
						category: "chart" as const,
						items: roundArtifacts.chart,
						icon: BarChart3,
						label: "Chart",
					},
					{
						category: "report" as const,
						items: roundArtifacts.report,
						icon: FileText,
						label: "Report",
					},
				].filter((button) => button.items.length > 0),
			[roundArtifacts],
		);

		useEffect(() => {
			setExpandedRoundCategory(null);
		}, [message.id]);

		return (
			<div className="flex justify-start gap-3 px-4 py-3">
				<div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border bg-white md:size-8">
					<img
						src="/logo.svg"
						alt="Assistant avatar"
						className="size-4 object-contain"
					/>
				</div>

				<div className="min-w-0 max-w-[min(80%,42rem)] space-y-1">
					{renderableParts.map((part, i) => {
						if (isReasoningPart(part)) {
							return (
								<ReasoningBlock
									key={`${message.id}-reasoning-${i}`}
									text={part.text}
								/>
							);
						}

						if (isTextPart(part)) {
							if (!part.text) return null;
							return (
								<TextBlock key={`${message.id}-text-${i}`} text={part.text} />
							);
						}

						if (isToolPart(part)) {
							return (
								<ToolCallBlock
									key={`${message.id}-tool-${i}`}
									part={part}
									onShowVnc={onShowVnc}
								/>
							);
						}

						if (isArtifactPart(part)) {
							const attachment: ChatAttachment = {
								extension: part.extension,
								fileId: part.fileId,
								filename: part.filename,
								preview: (part as Record<string, unknown>)
									.preview as ChatAttachment["preview"],
							};
							return (
								<button
									key={`${message.id}-artifact-${i}`}
									type="button"
									className="rounded-2xl"
									onClick={() => onSelectAttachment?.(attachment)}
								>
									<FileCard
										className="w-[15rem] max-w-full"
										extension={part.extension}
										fileName={part.filename}
										isClickable
									/>
								</button>
							);
						}

						return null;
					})}

					{thinkingTime != null && hasText && (
						<p className="text-[9px] text-muted-foreground sm:text-[10px]">
							{t("thoughtFor", { time: thinkingTime.toFixed(1) })}
						</p>
					)}

					{hasRoundArtifacts && onSelectRoundArtifact && (
						<div className="space-y-2 pt-2">
							<div className="flex flex-wrap gap-2">
								{roundButtons.map((button) => {
									const Icon = button.icon;
									const isExpanded = expandedRoundCategory === button.category;

									return (
										<button
											key={`${message.id}-${button.category}-button`}
											type="button"
											className={cn(
												"inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-[10px] transition-colors duration-200 hover:bg-muted sm:text-xs",
												isExpanded &&
													"border-primary bg-primary/5 text-primary",
											)}
											onClick={() => {
												if (button.items.length === 1) {
													const firstItem = button.items[0];
													if (firstItem) {
														onSelectRoundArtifact(firstItem);
													}
													return;
												}

												setExpandedRoundCategory((previousCategory) =>
													previousCategory === button.category
														? null
														: button.category,
												);
											}}
										>
											<Icon className="size-3" />
											<span>{button.label}</span>
											<span className="text-muted-foreground">
												({button.items.length})
											</span>
										</button>
									);
								})}
							</div>

							{expandedRoundCategory && (
								<div className="space-y-1 rounded-xl border bg-muted/30 p-2">
									{roundButtons
										.find((button) => button.category === expandedRoundCategory)
										?.items.map((artifact, index) => (
											<button
												key={artifact.id}
												type="button"
												className="flex w-full items-center justify-between rounded-lg bg-background px-2.5 py-1.5 text-left text-[10px] transition-colors duration-200 hover:bg-muted sm:text-xs"
												onClick={() => onSelectRoundArtifact(artifact)}
											>
												<span className="line-clamp-1 flex-1">
													{artifact.label || artifact.filename || artifact.id}
												</span>
												<span className="ml-3 shrink-0 text-muted-foreground">
													v{index + 1}
												</span>
											</button>
										))}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		);
	},
);

export default AssistantMessage;
