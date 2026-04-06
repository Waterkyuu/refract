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
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type RenameDialogProps = {
	sessionId: string;
	title: string;
};

const RenameDialog = ({ sessionId, title }: RenameDialogProps) => {
	const [open, setOpen] = useState(false);
	const [newTitle, setNewTitle] = useState(title ?? "");
	const t = useTranslations("renameChat");

	const { mutate: updateTitle, isPending } = useUpdateSessionTitle();

	const handleRename = useCallback(() => {
		if (!newTitle.trim()) {
			toast.error(t("titleEmpty"));
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
					toast.success(t("success"));
					setOpen(false);
				},
				onError: () => {
					toast.error(t("failed"));
				},
			},
		);
	}, [sessionId, newTitle, title, updateTitle, t]);

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
				{t("trigger")}
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<div className="flex items-center gap-2">
					<div className="grid flex-1 gap-2">
						<Label htmlFor="chat-title" className="sr-only">
							{t("chatName")}
						</Label>
						<Input
							id="chat-title"
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
						{t("cancel")}
					</Button>
					<Button onClick={handleRename} disabled={isPending}>
						{isPending ? t("saving") : t("save")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RenameDialog;
