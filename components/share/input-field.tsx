"use client";

import { firstUserInputAtom, userAtom } from "@/atoms";
import {
	pendingHomePromptAtom,
	pendingHomeUploadsAtom,
	showDatasetWorkspaceAtom,
} from "@/atoms/chat";
import loginDialogAtom from "@/atoms/login-dialog";
import FileCard from "@/components/share/file-card";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupText,
	InputGroupTextarea,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { handleError } from "@/lib/error-handler";
import { type UploadResult, cancelUpload, uploadFile } from "@/lib/upload-file";
import { cn, generateId } from "@/lib/utils";
import type { ChatAttachment } from "@/types/chat";
import { useAtom, useSetAtom } from "jotai";
import { ArrowUp, Plus, Square, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { memo, startTransition, useRef, useState } from "react";
import { toast } from "sonner";

type AppendFn = (
	message: {
		role: string;
		content: string;
	},
	options?: {
		metadata?: Record<string, unknown>;
		requestBody?: Record<string, unknown>;
	},
) => Promise<void>;

type InputFieldProps = {
	className?: string;
	size?: "default" | "md" | "sm";
	append?: AppendFn;
	externalAttachments?: ChatAttachment[];
	isLoading?: boolean;
	onOpenWorkspace?: () => void;
	stop?: () => void;
	input?: string;
	setInput?: (input: string) => void;
};

const sizeVariants = {
	default: {
		container: "w-full md:w-[35rem] lg:w-[42rem]",
		textarea:
			"min-h-20 px-4 md:min-h-24 placeholder:text-sm md:placeholder:text-base",
	},
	md: {
		container: "w-full md:w-80 lg:w-96",
		textarea:
			"min-h-16 px-3 md:min-h-20 placeholder:text-sm md:placeholder:text-base",
	},
	sm: {
		container: "w-full md:w-64 lg:w-80",
		textarea:
			"min-h-12 px-2 md:min-h-16 placeholder:text-xs md:placeholder:text-sm",
	},
};

const InputField = ({
	input = "",
	setInput,
	append,
	externalAttachments = [],
	isLoading = false,
	onOpenWorkspace,
	stop = () => {},
	className,
	size = "default",
}: InputFieldProps) => {
	const t = useTranslations("inputField");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const pathname = usePathname();
	const isHome = pathname === "/";
	const router = useRouter();

	const [firstUserInput, setFirstUserInput] = useAtom(firstUserInputAtom);
	const [user] = useAtom(userAtom);
	const [, setIsLoginDialogOpen] = useAtom(loginDialogAtom);
	const setPendingHomePrompt = useSetAtom(pendingHomePromptAtom);
	const setPendingHomeUploads = useSetAtom(pendingHomeUploadsAtom);
	const showDatasetWorkspace = useSetAtom(showDatasetWorkspaceAtom);

	const [attachments, setAttachments] = useState<File[]>([]);
	const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
	const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>(
		{},
	);
	const [isHomeSubmitting, setIsHomeSubmitting] = useState(false);

	const resetLocalAttachments = () => {
		setAttachments([]);
		setUploadedFiles([]);
		setUploadingFiles({});

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value;

		if (isHome) {
			setFirstUserInput(value);
		} else {
			if (setInput) {
				setInput(value);
			}
		}
	};

	const handleClickAttachment = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	};

	const handelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const supportedExtensions = [
			"pdf",
			"docx",
			"md",
			"txt",
			"typ",
			"csv",
			"xlsx",
			"xls",
		];

		if (!e.target.files || e.target.files.length === 0) {
			return;
		}

		const newFiles = Array.from(e.target.files);
		if (attachments.length + newFiles.length > 2) {
			toast.error(t("maxFilesReached"), {
				description: t("maxFilesDescription"),
			});
			return;
		}

		for (const currentFile of newFiles) {
			try {
				const fileName = currentFile.name;
				const suffix = fileName.split(".").pop()?.toLowerCase();

				if (!suffix || !supportedExtensions.includes(suffix)) {
					toast.error(t("unsupportedFile"), {
						description: t("unsupportedFileDescription"),
						action: {
							label: t("cancel"),
							onClick: () => console.log("Cancel"),
						},
					});
					continue;
				}

				setAttachments((prev) => [...prev, currentFile]);
				setUploadingFiles((prev) => ({ ...prev, [currentFile.name]: 0 }));

				try {
					const result = await uploadFile({
						file: currentFile,
						onProgress: (progress) => {
							setUploadingFiles((prev) => ({
								...prev,
								[currentFile.name]: progress,
							}));
						},
					});

					setUploadedFiles((prev) => [...prev, result]);
					if (result.preview) {
						showDatasetWorkspace({
							fileId: result.fileId,
							filename: result.filename,
							preview: result.preview,
						});
						onOpenWorkspace?.();
					}
					toast.success(t("fileUploaded"), {
						description: t("fileUploadSuccess", { fileName: currentFile.name }),
					});
				} catch (error) {
					handleError(error);
					// Remove from attachments on error
					setAttachments((prev) => prev.filter((f) => f !== currentFile));
				} finally {
					setUploadingFiles((prev) => {
						const next = { ...prev };
						delete next[currentFile.name];
						return next;
					});
				}
			} catch (error) {
				handleError(error);
			}
		}

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleRemoveAttachment = async (indexToRemove: number) => {
		const fileToRemove = attachments[indexToRemove];
		if (!fileToRemove) {
			return;
		}

		// Cancel upload if in progress
		if (uploadingFiles[fileToRemove.name] !== undefined) {
			await cancelUpload(fileToRemove.name);
		}

		setAttachments((prev) =>
			prev.filter((_, index) => index !== indexToRemove),
		);

		// Remove from uploaded files
		setUploadedFiles((prev) =>
			prev.filter((f) => f.filename !== fileToRemove.name),
		);
		setUploadingFiles((prev) => {
			const next = { ...prev };
			delete next[fileToRemove.name];
			return next;
		});
	};

	const handlePreviewDataset = (filename: string) => {
		const uploadedFile = uploadedFiles.find(
			(file) => file.filename === filename,
		);
		if (!uploadedFile?.preview) {
			return;
		}

		showDatasetWorkspace({
			fileId: uploadedFile.fileId,
			filename: uploadedFile.filename,
			preview: uploadedFile.preview,
		});
		onOpenWorkspace?.();
	};

	const getAttachmentMetadata = (): ChatAttachment[] =>
		uploadedFiles.map((uploadedFile) => {
			const localFile = attachments.find(
				(file) => file.name === uploadedFile.filename,
			);
			const extension =
				uploadedFile.filename.split(".").pop()?.toUpperCase() || "FILE";

			return {
				extension,
				fileId: uploadedFile.fileId,
				filename: uploadedFile.filename,
				fileSize: localFile?.size,
				preview: uploadedFile.preview,
			};
		});

	const displayAttachments =
		attachments.length > 0
			? attachments.map((file) => {
					const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
					const progress = uploadingFiles[file.name];
					const isFileUploading = progress !== undefined;
					const uploadedFile = uploadedFiles.find(
						(item) => item.filename === file.name,
					);
					const isPreviewable = Boolean(uploadedFile?.preview);

					return {
						filename: file.name,
						fileSize: file.size,
						extension: ext,
						isPreviewable,
						progress: isFileUploading ? progress : undefined,
						onClick: () => handlePreviewDataset(file.name),
						action: (
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									void handleRemoveAttachment(
										attachments.findIndex((item) => item === file),
									);
								}}
								className="-right-2 -top-2 absolute hidden h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-red-500 group-hover:flex"
							>
								<X className="h-3 w-3" />
							</button>
						),
					};
				})
			: externalAttachments.map((attachment) => ({
					filename: attachment.filename,
					fileSize: attachment.fileSize,
					extension: attachment.extension,
					isPreviewable: Boolean(attachment.preview),
					progress: undefined,
					onClick: () => {
						if (!attachment.preview) {
							return;
						}

						showDatasetWorkspace({
							fileId: attachment.fileId,
							filename: attachment.filename,
							preview: attachment.preview,
						});
						onOpenWorkspace?.();
					},
					action: undefined,
				}));

	const handleSumit = async () => {
		try {
			let newInput = "";

			if (firstUserInput && isHome) {
				if (isHomeSubmitting) {
					return;
				}

				if (!user?.id) {
					setIsLoginDialogOpen(true);
					return;
				}

				const trimmedInput = firstUserInput.trim();
				if (!trimmedInput) {
					return;
				}

				setPendingHomePrompt(trimmedInput);
				setPendingHomeUploads(getAttachmentMetadata());
				resetLocalAttachments();
				setIsHomeSubmitting(true);

				const sessionID = generateId();
				startTransition(() => {
					router.push(`/chat/${sessionID}`);
				});
				return;
			}
			newInput = input;
			if (setInput) {
				setInput("");
			}
			if (append) {
				const fileIds = uploadedFiles.map((f) => f.fileId);

				await append(
					{
						role: "user",
						content: newInput,
					},
					{
						requestBody: {
							fileIds,
						},
						metadata: {
							attachments: getAttachmentMetadata(),
						},
					},
				);
				resetLocalAttachments();
			}
		} catch (error) {
			handleError(error);
		}
	};

	return (
		<InputGroup
			className={cn(
				"flex flex-col rounded-3xl bg-white shadow-md transition-all",
				sizeVariants[size].container,
				className,
			)}
		>
			{/* Uploaded Files Display Area */}
			{displayAttachments.length > 0 && (
				// Modification Points : Added w-full and justify-start to force filling and left-align, eliminating the possible centering phenomenon
				<div className="flex w-full flex-wrap justify-start gap-3 px-4 pt-4 pb-1">
					{displayAttachments.map((attachment) => {
						return (
							<div key={attachment.filename} onClick={attachment.onClick}>
								<FileCard
									action={attachment.action}
									extension={attachment.extension}
									fileName={attachment.filename}
									fileSize={attachment.fileSize}
									isClickable={attachment.isPreviewable}
									progress={attachment.progress}
								/>
							</div>
						);
					})}
				</div>
			)}

			{/* Input area */}
			<InputGroupTextarea
				value={isHome ? firstUserInput : input}
				onChange={handleInputChange}
				placeholder={t("placeholder")}
				className={cn(
					sizeVariants[size].textarea,
					attachments.length > 0 ? "min-h-12 pt-2 md:min-h-16" : "",
				)}
			/>

			{/* Bottom section */}
			<InputGroupAddon align="block-end">
				<Tooltip>
					<TooltipTrigger asChild>
						<InputGroupButton
							variant="outline"
							className="rounded-full"
							size="icon-xs"
							onClick={handleClickAttachment}
						>
							<input
								type="file"
								ref={fileInputRef}
								className="hidden"
								accept=".pdf,.docx,.md,.txt,.typ,.csv,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
								onChange={handelFileUpload}
								multiple
							/>
							<Plus className="text-black" />
						</InputGroupButton>
					</TooltipTrigger>
					<TooltipContent>
						<p>{t("fileTooltip")}</p>
						{Object.keys(uploadingFiles).length > 0 && (
							<p className="text-blue-500">{t("uploading")}</p>
						)}
					</TooltipContent>
				</Tooltip>
				<InputGroupText className="ml-auto">52% used</InputGroupText>
				<Separator orientation="vertical" className="h-4!" />
				{isLoading ? (
					<InputGroupButton
						variant="default"
						className="rounded-full"
						size="icon-xs"
						onClick={() => stop()}
					>
						<Square fill="white" />
						<span className="sr-only">{t("stop")}</span>
					</InputGroupButton>
				) : (
					<InputGroupButton
						variant="default"
						className="rounded-full"
						size="icon-xs"
						disabled={
							isHomeSubmitting ||
							isLoading ||
							Object.keys(uploadingFiles).length > 0 ||
							!(isHome ? firstUserInput : input).trim()
						}
						onClick={handleSumit}
					>
						<ArrowUp />
						<span className="sr-only">{t("send")}</span>
					</InputGroupButton>
				)}
			</InputGroupAddon>
		</InputGroup>
	);
};

export default memo(InputField);
