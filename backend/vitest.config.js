import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    test: {
      globals: true,
      environment: "node",
      env,
      fileParallelism: false,       // ← les fichiers s'exécutent un par un
      globalSetup: "./tests/globalSetup.js",
      hookTimeout: 60000,
      testTimeout: 30000,
      coverage: {
        reporter: ["text", "html"],
        exclude: ["prisma/**", "tests/**", "*.config.js"],
      },
    },
  };
});