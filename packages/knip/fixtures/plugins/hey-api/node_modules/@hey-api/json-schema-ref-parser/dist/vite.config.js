"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const isBrowser = process.env.BROWSER === "true";
exports.default = (0, config_1.defineConfig)({
    test: {
        coverage: { reporter: ["lcov", "html", "text"] },
        dir: "test",
        environment: isBrowser ? "jsdom" : "node",
        exclude: ["**/__IGNORED__/**"],
        globals: true,
        globalSetup: isBrowser ? ["./test/fixtures/server.ts"] : undefined,
        include: ['./lib/**/*.test.ts'],
        passWithNoTests: true,
        reporters: ["verbose"],
        testTimeout: 5000,
        watch: false,
    },
});
