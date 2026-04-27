import { TypstSnippet } from "@myriaddreamin/typst.ts/contrib/snippet";

type TypstFontAsset = "text" | "cjk" | "emoji";

type TypstFontProvider = ReturnType<typeof TypstSnippet.preloadFontAssets>;

type TypstFontConfigurableCompiler = {
	use: (...providers: TypstFontProvider[]) => void;
};

type CreateTypstFontProvider = (options: {
	assets: TypstFontAsset[];
}) => TypstFontProvider;

const TYPST_FONT_ASSETS: TypstFontAsset[] = ["text", "cjk", "emoji"];

const configureTypstCompilerFonts = (
	compiler: TypstFontConfigurableCompiler,
	createFontProvider: CreateTypstFontProvider = TypstSnippet.preloadFontAssets,
): void => {
	compiler.use(
		createFontProvider({
			assets: TYPST_FONT_ASSETS,
		}),
	);
};

export { TYPST_FONT_ASSETS, configureTypstCompilerFonts };
export type {
	CreateTypstFontProvider,
	TypstFontAsset,
	TypstFontConfigurableCompiler,
	TypstFontProvider,
};
