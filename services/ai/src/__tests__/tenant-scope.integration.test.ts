import { beforeEach, describe, expect, it } from "vitest";
import { createAiApp } from "../app.js";
import { clearAiStore } from "../lib/store.js";

describe("ai tenant scope integration", () => {
  beforeEach(() => {
    clearAiStore();
  });

  it("pins CLIENT generation to x-client-id even if payload sets another client", async () => {
    const app = await createAiApp();

    const response = await app.inject({
      method: "POST",
      url: "/ai/generate",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440777"
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440888",
        prompt: "Generate project timeline"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.clientId).toBe("550e8400-e29b-41d4-a716-446655440777");
    await app.close();
  });

  it("returns only scoped tenant jobs for CLIENT role", async () => {
    const app = await createAiApp();

    await app.inject({
      method: "POST",
      url: "/ai/generate",
      headers: {
        "x-user-role": "ADMIN"
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440111",
        prompt: "First prompt"
      }
    });

    await app.inject({
      method: "POST",
      url: "/ai/generate",
      headers: {
        "x-user-role": "ADMIN"
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440222",
        prompt: "Second prompt"
      }
    });

    const response = await app.inject({
      method: "GET",
      url: "/ai/jobs",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440111"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data).toHaveLength(1);
    expect(response.json().data[0].clientId).toBe("550e8400-e29b-41d4-a716-446655440111");
    await app.close();
  });
});
