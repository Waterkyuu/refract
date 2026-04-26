import { $typst } from "@myriaddreamin/typst.ts";

type TypstCompileSuccess = {
	ok: true;
	svg: string;
};

type TypstCompileFailure = {
	ok: false;
	error: string;
	diagnostics: string;
};

type TypstCompileResult = TypstCompileSuccess | TypstCompileFailure;

type TypstSvgCompiler = {
	svg: (input: { mainContent: string }) => Promise<string | undefined>;
};

const formatTypstError = (error: unknown): string => {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message.trim();
	}

	return String(error).trim();
};

const createTypstCompiler =
	(compiler: TypstSvgCompiler) =>
	async (content: string): Promise<TypstCompileResult> => {
		try {
			const svg = await compiler.svg({
				mainContent: content,
			});

			if (!svg) {
				return {
					ok: false,
					error: "Typst compiler returned an empty SVG.",
					diagnostics: "Typst compiler returned an empty SVG.",
				};
			}

			return {
				ok: true,
				svg,
			};
		} catch (error) {
			const message = formatTypstError(error);

			return {
				ok: false,
				error: message,
				diagnostics: message,
			};
		}
	};

const compileTypst = createTypstCompiler($typst);

export { compileTypst, createTypstCompiler, formatTypstError };
export type {
	TypstCompileFailure,
	TypstCompileResult,
	TypstCompileSuccess,
	TypstSvgCompiler,
};
