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
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type DeleteChatDialogProps = {
	sessionId: string;
};

const DeleteChatDialog = ({ sessionId }: DeleteChatDialogProps) => {
	const [open, setOpen] = useState(false);
	const t = useTranslations("deleteChat");

	const { mutate: deleteChat, isPending } = useDeleteSession();

	const handleDelete = useCallback(() => {
		deleteChat(sessionId, {
			onSuccess: () => {
				toast.success(t("success"));
				setOpen(false);
			},
			onError: () => {
				toast.error(t("failed"));
			},
		});
	}, [sessionId, deleteChat, t]);

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger className="flex w-full items-center gap-2">
				<Trash className="size-3 text-red-600 md:size-4" />
				{t("trigger")}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("title")}</AlertDialogTitle>
					<AlertDialogDescription>{t("description")}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>
						{t("cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						className="bg-red-500 text-white hover:bg-red-600"
						onClick={handleDelete}
						disabled={isPending}
					>
						{isPending ? t("deleting") : t("continue")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default DeleteChatDialog;
