"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteSession } from "@/services/chat";
import { Trash } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type DeleteChatDialogProps = {
	sessionId: string;
};

const DeleteChatDialog = ({ sessionId }: DeleteChatDialogProps) => {
	const [open, setOpen] = useState(false);

	const { mutate: deleteChat, isPending } = useDeleteSession();

	const handleDelete = useCallback(() => {
		deleteChat(sessionId, {
			onSuccess: () => {
				toast.success("Chat deleted successfully");
				setOpen(false);
			},
			onError: () => {
				toast.error("Failed to delete chat");
			},
		});
	}, [sessionId, deleteChat]);

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger className="flex w-full items-center gap-2">
				<Trash className="size-4 text-red-600" />
				Delete
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete this chat
						session and all its messages from local storage.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className="bg-red-500 text-white hover:bg-red-600"
						onClick={handleDelete}
						disabled={isPending}
					>
						{isPending ? "Deleting..." : "Continue"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default DeleteChatDialog;
