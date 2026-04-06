import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { signOut } from "@/services/user";

type AvatarProps = {
	mode?: "default" | "online" | "offline";
	avatarUrl?: string | null; // Optional, can be null
	className?: string;
};

const Avatar = ({ mode = "default", className = "" }: AvatarProps) => {
	// Get user avatar and email
	if (mode === "online") {
		return (
			<div className={cn("relative size-6 rounded-full md:size-8", className)}>
				<img
					src="https://img.daisyui.com/images/profile/demo/yellingwoman@192.webp"
					alt="User avatar"
					className="rounded-full"
				/>
				<div className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 md:h-4 md:w-4" />
			</div>
		);
	}

	if (mode === "offline") {
		return (
			<div className={cn("relative size-6 rounded-full md:size-8", className)}>
				<img
					src="https://img.daisyui.com/images/profile/demo/yellingwoman@192.webp" // Avatar
					alt="User avatar"
					className="rounded-full"
				/>
				<div className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-gray-400 md:h-4 md:w-4" />
			</div>
		);
	}

	// Default mode with dropdown menu
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{/* Avatar */}
				<div className="relative size-6 cursor-pointer rounded-full md:size-8">
					<img
						src="https://img.daisyui.com/images/profile/demo/yellingwoman@192.webp"
						alt="User avatar"
						className="rounded-full"
					/>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end">
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuGroup>
					<DropdownMenuItem>
						Profile
						<DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						Billing
						<DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						Settings
						<DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						Keyboard shortcuts
						<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>Team</DropdownMenuItem>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
						<DropdownMenuPortal>
							<DropdownMenuSubContent>
								<DropdownMenuItem>Email</DropdownMenuItem>
								<DropdownMenuItem>Message</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem>More...</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuPortal>
					</DropdownMenuSub>
					<DropdownMenuItem>
						New Team
						<DropdownMenuShortcut>⌘+T</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem>API Key</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={signOut}>
					Log out
					<DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
export default Avatar;
