"use client";

import { sidebarOpenAtom } from "@/atoms/sidebar";
import DeleteChatDialog from "@/components/share/delete-chat-dialog";
import RenameDialog from "@/components/share/rename-dialog";
import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useAllSessions } from "@/services/chat";
import { useAtom } from "jotai";
import {
	MessageSquarePlus,
	MoreHorizontal,
	PanelRightDashed,
	Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useState } from "react";

type ChatHistoryItem = {
	id: string;
	title: string;
	updatedAt: number;
	createdAt: number;
	computedDate: string;
};

const Sidebar = () => {
	const pathname = usePathname();
	const router = useRouter();
	const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom);
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const t = useTranslations("sidebar");

	const { data: sessions = [] } = useAllSessions();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "k") {
				e.preventDefault();
				setIsSearchOpen(true);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	const closeSidebar = useCallback(() => {
		setIsOpen(false);
	}, [setIsOpen]);

	const handleNewChat = useCallback(() => {
		router.push("/");
	}, [router]);

	const handleSelectChat = useCallback(
		(chatId: string) => {
			router.push(`/chat/${chatId}`);
			setIsSearchOpen(false);
		},
		[router],
	);

	const chatHistory: ChatHistoryItem[] = sessions.map((session) => ({
		id: session.id,
		title: session.title,
		updatedAt: session.updatedAt,
		createdAt: session.createdAt,
		computedDate: formatRelativeDate(new Date(session.updatedAt)),
	}));

	const filteredChats = chatHistory.filter((chat) =>
		chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const groupedChats = filteredChats.reduce<Record<string, ChatHistoryItem[]>>(
		(acc, chat) => {
			if (!acc[chat.computedDate]) {
				acc[chat.computedDate] = [];
			}
			acc[chat.computedDate].push(chat);
			return acc;
		},
		{},
	);

	return (
		<>
			<div
				className={cn(
					"fixed inset-y-0 left-0 z-40 w-72 transform border-r bg-background transition-transform duration-300 ease-in-out",
					isOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="flex h-full flex-col">
					<div className="flex items-center justify-between border-b px-4 py-4">
						<Link href="/" className="font-lora text-xl" onClick={closeSidebar}>
							{t("brand")}
						</Link>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={closeSidebar}
							aria-label="Close sidebar"
							className="p-1"
						>
							<PanelRightDashed className="size-5" />
						</Button>
					</div>

					<div className="px-3 py-3">
						<Button
							variant="outline"
							className="w-full justify-start gap-2"
							onClick={handleNewChat}
						>
							<MessageSquarePlus className="size-4" />
							<span>{t("newChat")}</span>
						</Button>
					</div>

					<div className="px-3 pb-3">
						<Button
							variant="outline"
							className="w-full justify-start gap-2 text-muted-foreground"
							onClick={() => setIsSearchOpen(true)}
						>
							<Search className="size-4" />
							<span>{t("searchChats")}</span>
							<span className="ml-auto text-xs">Ctrl+K</span>
						</Button>
					</div>

					<ScrollArea className="flex-1 px-3">
						<div className="space-y-4 pb-4">
							{Object.entries(groupedChats).map(([date, chats]) => (
								<div key={date}>
									<h3 className="mb-2 px-2 font-medium text-muted-foreground text-xs">
										{date}
									</h3>
									<div className="space-y-0.5">
										{chats.map((chat) => (
											<div
												key={chat.id}
												className="group flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors duration-200 hover:bg-accent/50"
											>
												<Link
													href={`/chat/${chat.id}`}
													onClick={closeSidebar}
													className={cn(
														"line-clamp-1 flex-1 pr-2",
														pathname === `/chat/${chat.id}`
															? "font-medium text-accent-foreground"
															: "text-muted-foreground hover:text-foreground",
													)}
												>
													<span className="line-clamp-1">{chat.title}</span>
												</Link>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															className="-mr-1 h-6 w-6 opacity-0 transition-opacity hover:bg-transparent group-hover:opacity-100"
														>
															<MoreHorizontal className="size-3.5 text-muted-foreground" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="min-w-28">
														<DropdownMenuItem asChild>
															<RenameDialog
																sessionId={chat.id}
																title={chat.title}
															/>
														</DropdownMenuItem>
														<DropdownMenuItem asChild>
															<DeleteChatDialog sessionId={chat.id} />
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</ScrollArea>
				</div>
			</div>

			{isOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/50"
					onClick={closeSidebar}
					onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
				/>
			)}

			<CommandDialog
				open={isSearchOpen}
				onOpenChange={setIsSearchOpen}
				title={t("searchChatsTitle")}
				description={t("searchChatsDescription")}
			>
				<CommandInput
					placeholder={t("searchChats")}
					value={searchQuery}
					onValueChange={setSearchQuery}
				/>
				<CommandList>
					<CommandEmpty>{t("noChatsFound")}</CommandEmpty>
					<CommandGroup heading={t("chatHistory")}>
						{filteredChats.map((chat) => (
							<CommandItem
								key={chat.id}
								value={chat.title}
								onSelect={() => handleSelectChat(chat.id)}
							>
								<MessageSquarePlus className="mr-2 size-4" />
								<span>{chat.title}</span>
								<span className="ml-auto text-muted-foreground text-xs">
									{chat.computedDate}
								</span>
							</CommandItem>
						))}
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</>
	);
};

export default memo(Sidebar);
