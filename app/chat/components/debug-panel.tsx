"use client";

import { toolEventsAtom } from "@/atoms/chat";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ToolCallEvent } from "@/types/chat";
import { useAtomValue } from "jotai";
import { Bug, ChevronDown, ChevronRight, Clock, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";

const stateColors: Record<string, string> = {
	"partial-call": "bg-yellow-100 text-yellow-700",
	call: "bg-blue-100 text-blue-700",
	result: "bg-green-100 text-green-700",
};

const stateLabels: Record<string, string> = {
	"partial-call": "Streaming",
	call: "Called",
	result: "Done",
};

type ToolEventItemProps = {
	event: ToolCallEvent;
};

const ToolEventItem = memo(({ event }: ToolEventItemProps) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const t = useTranslations("debug");

	const durationStr =
		event.durationMs != null
			? `${(event.durationMs / 1000).toFixed(1)}s`
			: "...";

	return (
		<div className="min-w-0 border-b last:border-b-0">
			<button
				type="button"
				className="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left transition-colors duration-200 hover:bg-muted/50"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				{isExpanded ? (
					<ChevronDown className="size-3 shrink-0 text-muted-foreground" />
				) : (
					<ChevronRight className="size-3 shrink-0 text-muted-foreground" />
				)}
				<Wrench className="size-3 shrink-0 text-muted-foreground" />
				<span className="flex-1 truncate font-mono text-[10px] sm:text-xs">
					{event.toolName}
				</span>
				<Badge
					variant="secondary"
					className={cn(
						"shrink-0 text-[9px] sm:text-[10px]",
						stateColors[event.state] ?? "",
					)}
				>
					{stateLabels[event.state] ?? event.state}
				</Badge>
				<span className="flex shrink-0 items-center gap-1 text-[9px] text-muted-foreground sm:text-[10px]">
					<Clock className="size-2.5" />
					{durationStr}
				</span>
			</button>
			{isExpanded && (
				<div className="min-w-0 space-y-2 bg-muted/20 px-3 pt-1 pb-3">
					<div>
						<p className="mb-1 text-[9px] text-muted-foreground uppercase sm:text-[10px]">
							{t("arguments")}
						</p>
						<pre className="w-full max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded bg-background p-2 font-mono text-[10px] sm:text-[11px]">
							{JSON.stringify(event.args, null, 2)}
						</pre>
					</div>
					{event.result !== undefined && (
						<div>
							<p className="mb-1 text-[9px] text-muted-foreground uppercase sm:text-[10px]">
								{t("result")}
							</p>
							<pre className="w-full max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded bg-background p-2 font-mono text-[10px] sm:text-[11px]">
								{JSON.stringify(event.result, null, 2)}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
});

ToolEventItem.displayName = "ToolEventItem";

const DebugPanel = memo(() => {
	const toolEvents = useAtomValue(toolEventsAtom);
	const [isOpen, setIsOpen] = useState(false);
	const t = useTranslations("debug");

	return (
		<div className="min-w-0 border-t">
			<button
				type="button"
				className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors duration-200 hover:bg-muted/50"
				onClick={() => setIsOpen(!isOpen)}
			>
				<Bug className="size-3.5 text-muted-foreground" />
				<span className="font-medium text-[10px] sm:text-xs">
					{t("panelTitle")}
				</span>
				<Badge
					variant="secondary"
					className="ml-auto text-[9px] sm:text-[10px]"
				>
					{t("events", { count: toolEvents.length })}
				</Badge>
				{isOpen ? (
					<ChevronDown className="size-3 text-muted-foreground" />
				) : (
					<ChevronRight className="size-3 text-muted-foreground" />
				)}
			</button>
			{isOpen && (
				<ScrollArea className="max-h-64 min-w-0">
					{toolEvents.length === 0 ? (
						<p className="px-4 py-3 text-[10px] text-muted-foreground sm:text-xs">
							{t("noEvents")}
						</p>
					) : (
						toolEvents.map((event) => (
							<ToolEventItem key={event.id} event={event} />
						))
					)}
				</ScrollArea>
			)}
		</div>
	);
});

DebugPanel.displayName = "DebugPanel";

export default DebugPanel;
