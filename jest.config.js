const nextJest = require("next/jest");

const createJestConfig = nextJest({
	dir: "./",
});

/** @type {import('jest').Config} */
const customJestConfig = {
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	moduleNameMapper: {
		"^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
		"^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",
		"^@/(.*)$": "<rootDir>/$1",
	},
	testEnvironment: "jest-environment-jsdom",
	testPathIgnorePatterns: ["<rootDir>/tests/e2e/"],
};

module.exports = createJestConfig(customJestConfig);
