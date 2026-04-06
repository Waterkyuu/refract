"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateSessionTitle } from "@/services/chat";
import { Pencil } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type RenameDialogProps = {
	sessionId: string;
	title: string;
};

const RenameDialog = ({ sessionId, title }: RenameDialogProps) => {
	const [open, setOpen] = useState(false);
	const [newTitle, setNewTitle] = useState(title ?? "");

	const { mutate: updateTitle, isPending } = useUpdateSessionTitle();

	const handleRename = useCallback(() => {
		if (!newTitle.trim()) {
			toast.error("Title cannot be empty");
			return;
		}

		if (newTitle === title) {
			setOpen(false);
			return;
		}

		updateTitle(
			{ sessionId, title: newTitle.trim() },
			{
				onSuccess: () => {
					toast.success("Title updated successfully");
					setOpen(false);
				},
				onError: () => {
					toast.error("Failed to update title");
				},
			},
		);
	}, [sessionId, newTitle, title, updateTitle]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				handleRename();
			}
		},
		[handleRename],
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="flex w-full items-center gap-2">
				<Pencil className="size-4" />
				Rename
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit project name</DialogTitle>
					<DialogDescription>
						Give what you think more appropriate
					</DialogDescription>
				</DialogHeader>
				<div className="flex items-center gap-2">
					<div className="grid flex-1 gap-2">
						<Label htmlFor="project" className="sr-only">
							Project Name
						</Label>
						<Input
							id="project"
							value={newTitle}
							onChange={(e) => setNewTitle(e.target.value)}
							onKeyDown={handleKeyDown}
							disabled={isPending}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button onClick={handleRename} disabled={isPending}>
						{isPending ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RenameDialog;
