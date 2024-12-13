export default {
  "jest": {
    "config": [
      "jest.config.js",
      "project1/jest.config.js",
      "package.json"
    ],
    "entry": [
      "**/__tests__/**/*.[jt]s?(x)",
      "**/?(*.)+(spec|test).[jt]s?(x)"
    ]
  }
}