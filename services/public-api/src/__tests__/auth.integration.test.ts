import { describe, expect, it, beforeEach } from "vitest";
import { signWebhookPayload } from "@maphari/platform";
import { createPublicApiApp } from "../app.js";
import { clearPublicApiStore } from "../lib/store.js";

describe("public api authentication integration", () => {
  beforeEach(() => {
    clearPublicApiStore();
  });

  it("authenticates partner requests using key id + signature", async () => {
    const app = await createPublicApiApp();

    const issuedKeyResponse = await app.inject({
      method: "POST",
      url: "/public-api/keys",
      headers: {
        "x-user-role": "ADMIN"
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440551",
        label: "Partner Integration"
      }
    });

    expect(issuedKeyResponse.statusCode).toBe(200);
    const issuedKey = issuedKeyResponse.json().data;

    const partnerPayload = {
      name: "External Project",
      description: "Created by partner endpoint"
    };

    const signature = signWebhookPayload(JSON.stringify(partnerPayload), issuedKey.keySecret as string);

    const createProject = await app.inject({
      method: "POST",
      url: "/public-api/projects",
      headers: {
        "x-api-key-id": issuedKey.keyId as string,
        "x-api-signature": signature
      },
      payload: partnerPayload
    });

    expect(createProject.statusCode).toBe(200);
    expect(createProject.json().data.clientId).toBe("550e8400-e29b-41d4-a716-446655440551");
    await app.close();
  });

  it("rejects public api requests with invalid signature", async () => {
    const app = await createPublicApiApp();

    const response = await app.inject({
      method: "POST",
      url: "/public-api/projects",
      headers: {
        "x-api-key-id": "pk_invalid",
        "x-api-signature": "bad-signature"
      },
      payload: {
        name: "Unauthorized Project"
      }
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
