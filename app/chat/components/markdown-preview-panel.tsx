"use client";

import "@/styles/markdown-preview.css";
import "katex/dist/katex.min.css";
import { workspaceMarkdownContentAtom } from "@/atoms";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { exportMarkdownFile, exportMarkdownPdf } from "@/lib/markdown-export";
import { useAtomValue } from "jotai";
import { ChevronDown, Download, FileText } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { memo, useCallback, useRef, useState } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import Mermaid from "./mermaid-chart";

const MarkdownCodeBlock = ({
	className,
	children,
	...props
}: ComponentPropsWithoutRef<"code">) => {
	const langMatch = className?.match(/language-mermaid/);
	const codeString = String(children).replace(/\n$/, "");

	if (langMatch) {
		return <Mermaid chart={codeString} />;
	}

	return (
		<code {...props} className={className}>
			{children}
		</code>
	);
};

const MarkdownPreBlock = ({
	children,
	...props
}: ComponentPropsWithoutRef<"pre"> & { children?: ReactNode }) => {
	const child = children as ReactNode & {
		props?: { className?: string };
	};

	if (child?.props?.className?.includes("language-mermaid")) {
		return <>{children}</>;
	}

	return <pre {...props}>{children}</pre>;
};

const MarkdownPreview = () => {
	const markdownContent = useAtomValue(workspaceMarkdownContentAtom);
	const previewRef = useRef<HTMLElement>(null);
	const [isExportingPdf, setIsExportingPdf] = useState(false);
	const hasMarkdownContent = markdownContent.trim().length > 0;

	const handleExportMarkdown = useCallback(() => {
		exportMarkdownFile(markdownContent);
	}, [markdownContent]);

	const handleExportPdf = useCallback(async () => {
		if (isExportingPdf || !hasMarkdownContent || !previewRef.current) {
			return;
		}

		setIsExportingPdf(true);

		try {
			await exportMarkdownPdf({
				sourceElement: previewRef.current,
			});
		} finally {
			setIsExportingPdf(false);
		}
	}, [hasMarkdownContent, isExportingPdf]);

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex items-center justify-end border-b px-4 py-3">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={!hasMarkdownContent}
							className="transition-colors duration-200"
						>
							<Download className="size-3.5" />
							Export
							<ChevronDown className="size-3.5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="min-w-40">
						<DropdownMenuItem
							onClick={handleExportPdf}
							disabled={isExportingPdf}
						>
							<FileText className="size-4" />
							{isExportingPdf ? "PDF..." : "PDF"}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleExportMarkdown}>
							<FileText className="size-4" />
							Markdown
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<ScrollArea className="min-h-0 flex-1 p-6">
				<article
					ref={previewRef}
					className="prose prose-sm dark:prose-invert markdown-body max-w-none"
				>
					<Markdown
						remarkPlugins={[remarkGfm, remarkMath]}
						rehypePlugins={[rehypeRaw, rehypeKatex]}
						components={{
							code: MarkdownCodeBlock,
							pre: MarkdownPreBlock,
						}}
					>
						{markdownContent}
					</Markdown>
				</article>
			</ScrollArea>
		</div>
	);
};

export default memo(MarkdownPreview);
