import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
	dir: "./",
});

const customJestConfig: Config = {
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	moduleNameMapper: {
		"^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
		"^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/style-mock.js",
		"^@/(.*)$": "<rootDir>/$1",
		"^rehype-katex$": "<rootDir>/__mocks__/markdown-plugin-mock.js",
		"^rehype-raw$": "<rootDir>/__mocks__/markdown-plugin-mock.js",
		"^remark-gfm$": "<rootDir>/__mocks__/markdown-plugin-mock.js",
		"^remark-math$": "<rootDir>/__mocks__/markdown-plugin-mock.js",
	},
	testEnvironment: "jest-environment-jsdom",
	testPathIgnorePatterns: ["<rootDir>/tests/e2e/"],
};

export default createJestConfig(customJestConfig);
