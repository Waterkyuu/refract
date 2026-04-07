"use client";

import loginDialogAtom from "@/atoms/login-dialog";
import { sidebarOpenAtom } from "@/atoms/sidebar";
import { userAtom } from "@/atoms/user";
import Avatar from "@/components/share/avatar";
import LoginDialog from "@/components/share/login-dialog";
import Sidebar from "@/components/share/sidebar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAtom } from "jotai";
import { MenuIcon, PanelLeftDashed, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { memo, useCallback, useEffect, useState } from "react";

const Header = () => {
	const isMobile = useIsMobile();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [_, setSidebarOpen] = useAtom(sidebarOpenAtom);
	const t = useTranslations("header");
	const tMobile = useTranslations("mobileMenu");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const toggleMenu = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const openSidebar = useCallback(() => {
		setSidebarOpen(true);
	}, [setSidebarOpen]);

	const [user] = useAtom(userAtom);
	const [isLoginDialogOpen, setIsLoginDialogOpen] = useAtom(loginDialogAtom);
	const isLoggedIn = mounted && user?.id;

	return (
		<>
			<Sidebar />
			{!isLoggedIn && (
				<LoginDialog
					open={isLoginDialogOpen}
					onOpenChange={setIsLoginDialogOpen}
					loginText={t("login")}
					showTrigger={false}
				/>
			)}
			<div className="relative flex w-full items-center justify-between border-b px-3 py-3 md:px-4">
				{/* Sidebar toggle button */}
				<Button
					variant="ghost"
					size="icon-sm"
					className="p-1"
					onClick={openSidebar}
					aria-label="Open sidebar"
				>
					<PanelLeftDashed className="size-5" />
				</Button>
				<div className="flex items-center gap-2 md:gap-4">
					{isMobile ? (
						<Button
							variant="ghost"
							size="icon"
							onClick={toggleMenu}
							aria-label="Toggle menu"
						>
							<MenuIcon className="size-6" />
						</Button>
					) : isLoggedIn ? (
						<Avatar />
					) : (
						<Button
							className="cursor-pointer rounded-full"
							onClick={() => setIsLoginDialogOpen(true)}
						>
							{t("login")}
						</Button>
					)}
				</div>
			</div>

			{/* Mobile menu overlay */}
			{isMobile && isMenuOpen && (
				<div className="fixed inset-0 z-50 bg-background">
					<div className="flex h-full flex-col">
						{/* Menu header */}
						<div className="flex items-center justify-between border-b px-4 py-4 md:px-6">
							<Link
								href="/"
								className="font-lora text-xl sm:text-2xl md:text-4xl"
							>
								Fire Wave
							</Link>
							<Button
								variant="ghost"
								size="icon"
								onClick={toggleMenu}
								aria-label="Close menu"
							>
								<XIcon className="size-6" />
							</Button>
						</div>

						{/* Navigation links */}
						<div className="flex-1 overflow-auto">
							<nav className="flex flex-col space-y-4 p-4">
								<Link
									href="/"
									className="py-2 font-medium text-base sm:text-lg"
									onClick={toggleMenu}
								>
									{tMobile("home")}
								</Link>
								<Link
									href="/chat/111"
									className="py-2 font-medium text-base sm:text-lg"
									onClick={toggleMenu}
								>
									{tMobile("chat")}
								</Link>
								<Link
									href="/community"
									className="py-2 font-medium text-base sm:text-lg"
									onClick={toggleMenu}
								>
									{tMobile("community")}
								</Link>
							</nav>
						</div>

						{isLoggedIn ? (
							<Avatar />
						) : (
							<div className="flex items-center justify-center p-4">
								<Button
									className="cursor-pointer rounded-full"
									onClick={() => setIsLoginDialogOpen(true)}
								>
									{t("login")}
								</Button>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
};

export default memo(Header);
