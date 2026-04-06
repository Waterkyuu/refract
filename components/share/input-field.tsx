"use client";

import { firstUserInputAtom } from "@/atoms";
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
import { formatFileSize } from "@/lib/file";
import { type UploadResult, cancelUpload, uploadFile } from "@/lib/upload-file";
import { cn, generateId } from "@/lib/utils";
import { useAtom } from "jotai";
import { ArrowUp, FileText, Plus, Square, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { memo, useRef, useState } from "react";
import { toast } from "sonner";

type AppendFn = (
	message: {
		role: string;
		content: string;
	},
	options?: Record<string, unknown>,
) => Promise<void>;

type InputFieldProps = {
	className?: string;
	size?: "default" | "md" | "sm";
	append?: AppendFn;
	isLoading?: boolean;
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
	isLoading = false,
	stop = () => {},
	className,
	size = "default",
}: InputFieldProps) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const pathname = usePathname();
	const isHome = pathname === "/";
	const router = useRouter();

	const [firstUserInput, setFirstUserInput] = useAtom(firstUserInputAtom);

	const [attachments, setAttachments] = useState<File[]>([]);
	const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
	const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>(
		{},
	);

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
		const supportedExtensions = ["pdf", "docx", "md", "txt", "typ"];

		if (!e.target.files || e.target.files.length === 0) {
			return;
		}

		const newFiles = Array.from(e.target.files);
		if (attachments.length + newFiles.length > 2) {
			toast.error("Maximum files reached", {
				description: "You can only upload up to 2 files at a time.",
			});
			return;
		}

		for (const currentFile of newFiles) {
			try {
				const fileName = currentFile.name;
				const suffix = fileName.split(".").pop()?.toLowerCase();

				if (!suffix || !supportedExtensions.includes(suffix)) {
					toast.error("Unsupported file", {
						description: "Only support pdf, docx, md, txt, typ files",
						action: {
							label: "Cancel",
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
					toast.success("File uploaded successfully", {
						description: `${currentFile.name} has been indexed and is ready for RAG`,
					});
				} catch (error) {
					handleError(error);
					toast.error("Upload failed", {
						description: `Failed to upload ${currentFile.name}`,
					});
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
				console.error("Failed to upload file", error);
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

	const handleSumit = async () => {
		try {
			let newInput = "";

			if (firstUserInput && isHome) {
				const sessionID = generateId();
				router.push(`/chat/${sessionID}`);
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
					},
				);
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
			{attachments.length > 0 && (
				// Modification Points : Added w-full and justify-start to force filling and left-align, eliminating the possible centering phenomenon
				<div className="flex w-full flex-wrap justify-start gap-3 px-4 pt-4 pb-1">
					{attachments.map((file, index) => {
						const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
						const progress = uploadingFiles[file.name];
						const isFileUploading = progress !== undefined;
						return (
							<div
								key={index}
								className="group relative flex w-[16rem] items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-2.5 pr-4"
							>
								{/* File Icon */}
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white">
									<FileText className="h-5 w-5 text-gray-500" />
								</div>

								{/* File Info */}
								<div className="flex flex-col overflow-hidden text-left">
									<span className="truncate font-medium text-gray-700 text-sm">
										{file.name}
									</span>
									<span className="mt-0.5 truncate text-[11px] text-gray-400">
										{ext} {formatFileSize(file.size)}
										{isFileUploading && ` - ${Math.round(progress * 100)}%`}
									</span>
								</div>

								{/* Upload Progress Indicator */}
								{isFileUploading && (
									<div
										className="absolute bottom-0 left-0 h-0.5 bg-blue-500 transition-all duration-300"
										style={{ width: `${progress * 100}%` }}
									/>
								)}

								{/* Remove Button */}
								<button
									type="button"
									onClick={() => handleRemoveAttachment(index)}
									className="-right-2 -top-2 absolute hidden h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-red-500 group-hover:flex"
								>
									<X className="h-3 w-3" />
								</button>
							</div>
						);
					})}
				</div>
			)}

			{/* Input area */}
			<InputGroupTextarea
				value={isHome ? firstUserInput : input}
				onChange={handleInputChange}
				placeholder="Ask, Search or Chat..."
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
								accept=".pdf,.docx,.md,.txt,.typ,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown,text/plain"
								onChange={handelFileUpload}
								multiple
							/>
							<Plus className="text-black" />
						</InputGroupButton>
					</TooltipTrigger>
					<TooltipContent>
						<p>Only support pdf, docx, md, txt, typ, 2 max</p>
						{Object.keys(uploadingFiles).length > 0 && (
							<p className="text-blue-500">Uploading...</p>
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
						<span className="sr-only">Stop</span>
					</InputGroupButton>
				) : (
					<InputGroupButton
						variant="default"
						className="rounded-full"
						size="icon-xs"
						disabled={
							Object.keys(uploadingFiles).length > 0 ||
							!(isHome ? firstUserInput : input).trim()
						}
						onClick={handleSumit}
					>
						<ArrowUp />
						<span className="sr-only">Send</span>
					</InputGroupButton>
				)}
			</InputGroupAddon>
		</InputGroup>
	);
};

export default memo(InputField);
