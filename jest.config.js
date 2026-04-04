const nextJest = require("next/jest");

const createJestConfig = nextJest({
	dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
	// The setup file that runs before each test
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"], 

	// Handle module aliases (if you have configured paths in tsconfig.json)
	// next/jest 会自动处理绝大部分，但如果你遇到别名报错，可以在这里手动映射
	moduleNameMapper: {
		// Handle CSS imports (with CSS modules)
		// https://jestjs.io/docs/webpack#mocking-css-modules
		"^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",

		// Handle CSS imports (without CSS modules)
		"^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",

		"^@/(.*)$": "<rootDir>/$1",
	},

	testEnvironment: "jest-environment-jsdom",
};

module.exports = createJestConfig(customJestConfig);
