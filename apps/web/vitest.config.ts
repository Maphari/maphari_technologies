import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["src/e2e/**", "node_modules/**", "dist/**", ".next/**"]
  }
});
