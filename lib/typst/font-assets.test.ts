import {
	type TypstFontProvider,
	configureTypstCompilerFonts,
} from "./font-assets";

describe("configureTypstCompilerFonts", () => {
	it("registers text, CJK, and emoji font assets", () => {
		const provider: TypstFontProvider = {
			key: "font-assets",
			forRoles: ["compiler"],
			provides: [],
		};
		const createFontProvider = jest.fn(() => provider);
		const compiler = {
			use: jest.fn(),
		};

		configureTypstCompilerFonts(compiler, createFontProvider);

		expect(createFontProvider).toHaveBeenCalledWith({
			assets: ["text", "cjk", "emoji"],
		});
		expect(compiler.use).toHaveBeenCalledWith(provider);
	});
});
