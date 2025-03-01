module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(axios)/)"
  ],
  resolver: "<rootDir>/jest-resolver.js", // Use custom resolver
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy", // Mock CSS files
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect"], // Add custom matchers
};