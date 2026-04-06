"use client";

import { toolEventsAtom } from "@/atoms/chat";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ToolCallEvent } from "@/types/chat";
import { useAtomValue } from "jotai";
import { Bug, ChevronDown, ChevronRight, Clock, Wrench } from "lucide-react";
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

	const durationStr =
		event.durationMs != null
			? `${(event.durationMs / 1000).toFixed(1)}s`
			: "...";

	return (
		<div className="border-b last:border-b-0">
			<button
				type="button"
				className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-200 hover:bg-muted/50"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				{isExpanded ? (
					<ChevronDown className="size-3 shrink-0 text-muted-foreground" />
				) : (
					<ChevronRight className="size-3 shrink-0 text-muted-foreground" />
				)}
				<Wrench className="size-3 shrink-0 text-muted-foreground" />
				<span className="flex-1 truncate font-mono text-xs">
					{event.toolName}
				</span>
				<Badge
					variant="secondary"
					className={cn("shrink-0 text-[10px]", stateColors[event.state] ?? "")}
				>
					{stateLabels[event.state] ?? event.state}
				</Badge>
				<span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
					<Clock className="size-2.5" />
					{durationStr}
				</span>
			</button>
			{isExpanded && (
				<div className="space-y-2 bg-muted/20 px-3 pt-1 pb-3">
					<div>
						<p className="mb-1 text-[10px] text-muted-foreground uppercase">
							Arguments
						</p>
						<pre className="overflow-x-auto rounded bg-background p-2 font-mono text-[11px]">
							{JSON.stringify(event.args, null, 2)}
						</pre>
					</div>
					{event.result !== undefined && (
						<div>
							<p className="mb-1 text-[10px] text-muted-foreground uppercase">
								Result
							</p>
							<pre className="overflow-x-auto rounded bg-background p-2 font-mono text-[11px]">
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

	return (
		<div className="border-t">
			<button
				type="button"
				className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors duration-200 hover:bg-muted/50"
				onClick={() => setIsOpen(!isOpen)}
			>
				<Bug className="size-3.5 text-muted-foreground" />
				<span className="font-medium text-xs">Debug Panel</span>
				<Badge variant="secondary" className="ml-auto text-[10px]">
					{toolEvents.length} events
				</Badge>
				{isOpen ? (
					<ChevronDown className="size-3 text-muted-foreground" />
				) : (
					<ChevronRight className="size-3 text-muted-foreground" />
				)}
			</button>
			{isOpen && (
				<ScrollArea className="max-h-64">
					{toolEvents.length === 0 ? (
						<p className="px-4 py-3 text-muted-foreground text-xs">
							No tool events recorded yet.
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
