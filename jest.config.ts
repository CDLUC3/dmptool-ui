import nextJest from "next/jest.js";
import type { Config } from 'jest'

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  moduleDirectories: ["node_modules", "<rootDir>/"],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|scss|sass)$': 'identity-obj-proxy',// Added so I can mock CSS imports for layout.tsx
    '^@fontsource/.*$': '<rootDir>/__mocks__/styleMock.js',
    '^@fortawesome/.*$': '<rootDir>/__mocks__/styleMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/app/\\[locale\\]/styleguide/'],
  collectCoverage: true,
  collectCoverageFrom: [
    "app/**",  // Include all pages
    "components/**"// Include components
  ],
  // Add coverage path ignore patterns to exclude server actions
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/app/actions/",         // Exclude server actions in app/actions
    "/actions/",             // Exclude server actions if in root actions folder
    "<rootDir>/app/\\[locale\\]/styleguide/sg-components.tsx", // Exclude style guide
    "<rootDir>/components/Header", // Exclude Header component for now until we implement a new one
    "<rootDir>/components/Footer", // Exclude Footer component for now until we implement a new one
    "<rootDir>/app/\\[locale\\]/styleguide/", // Exclude style guide
    "<rootDir>/app/types/index.ts", // Exclude types
    "<rootDir>/app/\\[locale\\]/healthcheck/page.tsx", // Exclude health check
    ".*\\.server\\.(js|ts|tsx)$"  // Optional: Exclude files ending with .server.ts etc.
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 84,
      lines: 85,
      statements: 85,
    }
  },
  coverageDirectory: "coverage",
  // Add extensionsToTreatAsEsm and globals for better ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
} satisfies Config;


// createJestConfig seems to add its own transformIgnorePatterns that conflict with our own transformIgnorePatterns
// so this approach makes sure that only our config is applied
const getJestConfig = async () => {
  const config = await createJestConfig(customJestConfig)();

  // Updated transformIgnorePatterns to handle next-intl and its dependencies
  // Ignore (don't transform) everything under node_modules, except paths that match one of these package names
  // sanitize-html and its dependencies recently started shipping ESM-only builds, which causes issues with Jest's default transformIgnorePatterns.
  config.transformIgnorePatterns = [
    'node_modules/(?!(sanitize-html|htmlparser2|entities|dom-serializer|domhandler|domutils|domelementtype|use-intl|next-intl|@formatjs|intl-messageformat|.*\\.mjs$)/)',
  ]

  return config;
};

export default getJestConfig;