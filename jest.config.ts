/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ["./dist/"],
  clearMocks: true,
  setupFiles: ['./tests/setup.ts'],
};