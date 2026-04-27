const DEFAULT_TYPST_TEXT_SET = `#set text(
  font: ("New Computer Modern", "SimSun", "PingFang SC", "Microsoft YaHei"),
  lang: "zh",
  fallback: true,
)`;

type TextSetBlock = {
	openParen: number;
	end: number;
	body: string;
};

const findTextSetBlock = (content: string): TextSetBlock | undefined => {
	const setTextPattern = /#set\s+text\s*\(/g;
	let match = setTextPattern.exec(content);

	while (match) {
		const matchedText = match[0] ?? "";
		const openParen = match.index + matchedText.lastIndexOf("(");
		let depth = 0;
		let inString = false;
		let escaped = false;

		for (let index = openParen; index < content.length; index += 1) {
			const char = content[index];

			if (!char) {
				continue;
			}

			if (escaped) {
				escaped = false;
				continue;
			}

			if (char === "\\") {
				escaped = true;
				continue;
			}

			if (char === '"') {
				inString = !inString;
				continue;
			}

			if (inString) {
				continue;
			}

			if (char === "(") {
				depth += 1;
				continue;
			}

			if (char === ")") {
				depth -= 1;
				if (depth === 0) {
					const body = content.slice(openParen + 1, index);
					if (/(^|[\s,])font\s*:/.test(body)) {
						return {
							openParen,
							end: index,
							body,
						};
					}
					break;
				}
			}
		}

		match = setTextPattern.exec(content);
	}

	return undefined;
};

const buildBodyWithFallback = (body: string): string => {
	const lines = body.split("\n");
	let insertIndex = lines.length;

	while (insertIndex > 0 && (lines[insertIndex - 1] ?? "").trim() === "") {
		insertIndex -= 1;
	}

	const previousLine = lines[insertIndex - 1] ?? "";
	if (previousLine.trim().length > 0 && !previousLine.trimEnd().endsWith(",")) {
		lines[insertIndex - 1] = `${previousLine},`;
	}

	const indent = previousLine.match(/^(\s*)/)?.[1] || "  ";
	lines.splice(insertIndex, 0, `${indent}fallback: true,`);

	return lines.join("\n");
};

const ensureTypstTextFallback = (content: string): string => {
	const textSetBlock = findTextSetBlock(content);

	if (!textSetBlock) {
		return `${DEFAULT_TYPST_TEXT_SET}\n\n${content}`;
	}

	const { body, openParen, end } = textSetBlock;
	if (/(^|[\s,])fallback\s*:\s*true([\s,)]|,|$)/.test(body)) {
		return content;
	}

	const updatedBody = /(^|[\s,])fallback\s*:/.test(body)
		? body.replace(/fallback\s*:\s*(true|false)/, "fallback: true")
		: buildBodyWithFallback(body);

	return `${content.slice(0, openParen + 1)}${updatedBody}${content.slice(end)}`;
};

export { DEFAULT_TYPST_TEXT_SET, ensureTypstTextFallback };
