"use client";

import { pipelineAtom } from "@/atoms/pipeline";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PipelineStep, StepStatus } from "@/types/agent";
import { useAtomValue } from "jotai";
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	CircleDashed,
	ListTodo,
	LoaderCircle,
} from "lucide-react";
import { memo, useMemo, useState } from "react";

const STEP_CONFIG: Record<
	PipelineStep,
	{ description: string; label: string }
> = {
	data: {
		label: "Data",
		description: "Read, clean and summarize attached data",
	},
	chart: {
		label: "Chart",
		description: "Generate charts from the cleaned dataset",
	},
	report: {
		label: "Report",
		description: "Write the final analysis report",
	},
};

const STATUS_CONFIG: Record<
	StepStatus,
	{
		badgeClassName: string;
		icon: typeof CircleDashed;
		label: string;
	}
> = {
	pending: {
		label: "Pending",
		icon: CircleDashed,
		badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
	},
	running: {
		label: "Running",
		icon: LoaderCircle,
		badgeClassName: "border-sky-200 bg-sky-100 text-sky-700",
	},
	completed: {
		label: "Completed",
		icon: CheckCircle2,
		badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-700",
	},
	error: {
		label: "Error",
		icon: AlertCircle,
		badgeClassName: "border-rose-200 bg-rose-100 text-rose-700",
	},
};

const STEP_ORDER: PipelineStep[] = ["data", "chart", "report"];

const DebugPanel = memo(() => {
	const { currentStep, plan, stepStatus } = useAtomValue(pipelineAtom);
	const [isOpen, setIsOpen] = useState(false);

	const completedCount = useMemo(
		() => STEP_ORDER.filter((step) => stepStatus[step] === "completed").length,
		[stepStatus],
	);

	return (
		<div className="min-w-0 shrink-0 border-t bg-background">
			<button
				type="button"
				className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors duration-200 hover:bg-muted/50"
				onClick={() => setIsOpen(!isOpen)}
			>
				<ListTodo className="size-3.5 text-muted-foreground" />
				<span className="font-medium text-[10px] sm:text-xs">
					Pipeline Steps
				</span>
				<Badge
					variant="secondary"
					className="ml-auto text-[9px] sm:text-[10px]"
				>
					{completedCount}/{STEP_ORDER.length} completed
				</Badge>
				{isOpen ? (
					<ChevronDown className="size-3 text-muted-foreground" />
				) : (
					<ChevronRight className="size-3 text-muted-foreground" />
				)}
			</button>
			{isOpen && (
				<div className="space-y-2 px-4 pt-1 pb-4">
					{plan?.reasoning ? (
						<p className="rounded-md border bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground sm:text-xs">
							{plan.reasoning}
						</p>
					) : null}
					<div className="space-y-2">
						{STEP_ORDER.map((step) => {
							const { description, label } = STEP_CONFIG[step];
							const status = stepStatus[step];
							const {
								badgeClassName,
								icon: StatusIcon,
								label: statusLabel,
							} = STATUS_CONFIG[status];
							const isCurrent = currentStep === step;

							return (
								<div
									key={step}
									className={cn(
										"flex items-start gap-3 rounded-lg border px-3 py-3 transition-colors duration-200",
										isCurrent && "border-sky-300 bg-sky-50/60",
									)}
								>
									<StatusIcon
										className={cn(
											"mt-0.5 size-4 shrink-0",
											status === "pending" && "text-slate-500",
											status === "running" && "animate-spin text-sky-600",
											status === "completed" && "text-emerald-600",
											status === "error" && "text-rose-600",
										)}
									/>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="font-medium text-xs sm:text-sm">{label}</p>
											<Badge
												variant="outline"
												className={cn(
													"text-[9px] sm:text-[10px]",
													badgeClassName,
												)}
											>
												{statusLabel}
											</Badge>
											{isCurrent ? (
												<Badge
													variant="secondary"
													className="text-[9px] sm:text-[10px]"
												>
													Current
												</Badge>
											) : null}
										</div>
										<p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
											{description}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
});

export default DebugPanel;
