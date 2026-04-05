"use client";

import { useAtomValue } from "jotai";
import { History, Menu, Plus, UserRound } from "lucide-react";

import { isLoginAtom } from "@/atoms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeaderProps = {
	onHistoryClick: () => void;
	onNewChatClick: () => void;
	className?: string;
};

const Header = ({ onHistoryClick, onNewChatClick, className }: HeaderProps) => {
	const isLoggedIn = useAtomValue(isLoginAtom);

	const actionItems = [
		{
			label: "History",
			icon: History,
			onClick: onHistoryClick,
			className: "hidden md:inline-flex xl:hidden",
		},
		{
			label: "Menu",
			icon: Menu,
			onClick: onHistoryClick,
			className: "md:hidden",
		},
		{
			label: "New task",
			icon: Plus,
			onClick: onNewChatClick,
			className: "",
		},
	];

	return (
		<header
			className={cn(
				"fixed inset-x-0 top-0 z-40 border-white/40 border-b bg-white/85 backdrop-blur-xl",
				className,
			)}
		>
			<div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6">
				<div className="flex items-center gap-2">
					{actionItems.map(
						({ label, icon: Icon, onClick, className: itemClass }) => (
							<Button
								key={label}
								className={cn("transition-colors duration-200", itemClass)}
								onClick={onClick}
								size="sm"
								variant="outline"
							>
								<Icon className="size-4" />
								<span className="hidden sm:inline">{label}</span>
							</Button>
						),
					)}
				</div>

				<div className="ml-auto flex items-center gap-3">
					<div className="text-right">
						<p className="font-lora text-lg text-slate-900 uppercase tracking-[0.24em]">
							Operator Desk
						</p>
						<p className="text-slate-500 text-xs">
							Autonomous browser agent workspace
						</p>
					</div>

					{isLoggedIn ? (
						<div className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-950 text-white">
							<UserRound className="size-4" />
						</div>
					) : (
						<Button className="transition-colors duration-200" size="sm">
							Login
						</Button>
					)}
				</div>
			</div>
		</header>
	);
};

export { Header };
