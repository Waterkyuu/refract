"use client";

import { ChevronDown, ChevronUp, TerminalSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatEventDuration, formatEventTimestamp } from "@/lib/agent-events";
import type { AgentState } from "@/types";

type DebugPanelProps = {
	isOpen: boolean;
	onToggle: () => void;
	state: AgentState;
};

const DebugPanel = ({ isOpen, onToggle, state }: DebugPanelProps) => {
	const statItems = [
		{ label: "Clicks", value: state.stats.click },
		{ label: "Types", value: state.stats.type },
		{ label: "Scrolls", value: state.stats.scroll },
	];

	return (
		<section className="rounded-[1.5rem] border border-slate-200 bg-slate-950 text-slate-100 shadow-sm">
			<div className="flex items-center justify-between gap-3 px-4 py-3">
				<div className="flex items-center gap-3">
					<div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-emerald-300">
						<TerminalSquare className="size-4" />
					</div>
					<div>
						<p className="font-medium">Debug Panel</p>
						<p className="text-slate-400 text-xs">
							Raw tool events streamed through the client state pipeline
						</p>
					</div>
				</div>

				<Button
					className="transition-colors duration-200"
					onClick={onToggle}
					size="sm"
					variant="secondary"
				>
					{isOpen ? (
						<>
							Collapse
							<ChevronDown className="size-4" />
						</>
					) : (
						<>
							Expand
							<ChevronUp className="size-4" />
						</>
					)}
				</Button>
			</div>

			{isOpen ? (
				<div className="border-slate-800 border-t px-4 py-4">
					<div className="mb-4 flex flex-wrap gap-2">
						{statItems.map((item) => (
							<Badge key={item.label} variant="secondary">
								{item.label}: {item.value}
							</Badge>
						))}
						<Badge
							variant={state.status === "error" ? "destructive" : "outline"}
						>
							Status: {state.status}
						</Badge>
					</div>

					<ScrollArea className="h-64 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
						<div className="space-y-3">
							{state.events.length === 0 ? (
								<p className="text-slate-500 text-sm">
									Tool calls will appear here as soon as the agent starts
									working.
								</p>
							) : (
								state.events.map((event) => (
									<div
										className="rounded-xl border border-slate-800 bg-slate-950/80 p-3"
										key={event.id}
									>
										<div className="mb-2 flex flex-wrap items-center gap-2">
											<Badge variant="outline">{event.type}</Badge>
											<Badge
												variant={
													event.status === "error"
														? "destructive"
														: event.status === "success"
															? "secondary"
															: "outline"
												}
											>
												{event.status}
											</Badge>
											<span className="text-slate-500 text-xs">
												{formatEventTimestamp(event.timestamp)}
											</span>
											<span className="text-slate-500 text-xs">
												{formatEventDuration(event.duration)}
											</span>
										</div>
										<p className="mb-2 text-slate-200 text-sm">
											{event.summary}
										</p>
										<pre className="overflow-x-auto rounded-lg bg-black/30 p-3 text-[11px] text-slate-400">
											{JSON.stringify(event.payload, null, 2)}
										</pre>
									</div>
								))
							)}
						</div>
					</ScrollArea>
				</div>
			) : null}
		</section>
	);
};

export { DebugPanel };
