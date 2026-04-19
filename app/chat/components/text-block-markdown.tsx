"use client";

import { cn } from "@/lib/utils";
import { type ComponentPropsWithoutRef, memo, useDeferredValue } from "react";
import Markdown, { type Components } from "react-markdown";

type TextBlockMarkdownProps = {
	text: string;
};

const SANDBOX_LOCAL_PATH_PREFIXES = ["/home/user/"];

const isSandboxLocalPath = (value?: string | null) =>
	Boolean(
		value &&
			SANDBOX_LOCAL_PATH_PREFIXES.some((prefix) => value.startsWith(prefix)),
	);

type TextMarkdownCodeProps = ComponentPropsWithoutRef<"code">;
type TextMarkdownPreProps = ComponentPropsWithoutRef<"pre">;
type TextMarkdownTableProps = ComponentPropsWithoutRef<"table">;
type TextMarkdownAnchorProps = ComponentPropsWithoutRef<"a">;
type TextMarkdownImageProps = ComponentPropsWithoutRef<"img">;

const TextMarkdownCode = ({ className, ...props }: TextMarkdownCodeProps) => (
	<code {...props} className={cn("whitespace-pre-wrap break-all", className)} />
);

const TextMarkdownPre = ({ children, ...props }: TextMarkdownPreProps) => (
	<pre
		{...props}
		className="max-w-full overflow-x-auto whitespace-pre-wrap break-words"
	>
		{children}
	</pre>
);

const TextMarkdownTable = ({ children, ...props }: TextMarkdownTableProps) => (
	<div className="max-w-full overflow-x-auto">
		<table {...props}>{children}</table>
	</div>
);

const TextMarkdownAnchor = ({
	children,
	href,
	...props
}: TextMarkdownAnchorProps) => {
	const stringHref = typeof href === "string" ? href : undefined;

	if (isSandboxLocalPath(stringHref)) {
		return (
			<code className="break-all rounded bg-background/70 px-1 py-0.5 text-[0.85em]">
				{stringHref}
			</code>
		);
	}

	return (
		<a {...props} href={stringHref}>
			{children}
		</a>
	);
};

const TextMarkdownImage = ({
	alt,
	src,
	className,
	...props
}: TextMarkdownImageProps) => {
	const stringSrc = typeof src === "string" ? src : undefined;

	if (isSandboxLocalPath(stringSrc)) {
		return (
			<code className="break-all rounded bg-background/70 px-1 py-0.5 text-[0.85em]">
				{alt ? `${alt}: ${stringSrc}` : stringSrc}
			</code>
		);
	}

	return (
		<img
			{...props}
			alt={alt ?? ""}
			className={cn("max-w-full rounded-lg", className)}
			src={stringSrc}
		/>
	);
};

const TEXT_BLOCK_MARKDOWN_COMPONENTS: Components = {
	code: TextMarkdownCode,
	pre: TextMarkdownPre,
	table: TextMarkdownTable,
	a: TextMarkdownAnchor,
	img: TextMarkdownImage,
};

const TextBlockMarkdown = memo(({ text }: TextBlockMarkdownProps) => {
	const deferredText = useDeferredValue(text);

	return (
		<div className="prose prose-sm max-w-full prose-pre:max-w-full prose-pre:overflow-x-auto break-words prose-headings:break-words prose-li:break-words prose-p:break-words prose-code:break-all">
			<Markdown components={TEXT_BLOCK_MARKDOWN_COMPONENTS}>
				{deferredText}
			</Markdown>
		</div>
	);
});

export { TextBlockMarkdown };
export type { TextBlockMarkdownProps };
