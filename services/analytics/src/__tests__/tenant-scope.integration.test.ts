import { beforeEach, describe, expect, it } from "vitest";
import { createAnalyticsApp } from "../app.js";
import { clearAnalyticsStore } from "../lib/store.js";

describe("analytics tenant scope integration", () => {
  beforeEach(() => {
    clearAnalyticsStore();
  });

  it("pins CLIENT ingest to scoped tenant", async () => {
    const app = await createAnalyticsApp();

    const response = await app.inject({
      method: "POST",
      url: "/analytics/events",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440333"
      },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440444",
        eventName: "file.uploaded"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.clientId).toBe("550e8400-e29b-41d4-a716-446655440333");
    await app.close();
  });

  it("returns scoped analytics metrics for CLIENT requests", async () => {
    const app = await createAnalyticsApp();

    await app.inject({
      method: "POST",
      url: "/analytics/events",
      headers: { "x-user-role": "ADMIN" },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440121",
        eventName: "lead.created"
      }
    });

    await app.inject({
      method: "POST",
      url: "/analytics/events",
      headers: { "x-user-role": "ADMIN" },
      payload: {
        clientId: "550e8400-e29b-41d4-a716-446655440122",
        eventName: "lead.created"
      }
    });

    const response = await app.inject({
      method: "GET",
      url: "/analytics/metrics",
      headers: {
        "x-user-role": "CLIENT",
        "x-client-id": "550e8400-e29b-41d4-a716-446655440121"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.totalEvents).toBe(1);
    await app.close();
  });
});
