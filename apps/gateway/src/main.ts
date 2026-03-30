import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createGatewayApp } from "./app.js";
import { validateRequiredEnv } from "./lib/validate-env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
const processWithEnvLoader = process as typeof process & { loadEnvFile?: (path?: string) => void };
processWithEnvLoader.loadEnvFile?.(envPath);

validateRequiredEnv(["JWT_ACCESS_SECRET"]);

const app = await createGatewayApp();
const port = Number(process.env.PORT ?? 4000);
await app.listen(port, "0.0.0.0");
