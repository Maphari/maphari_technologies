import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    publicApiKey: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    publicApiProject: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../lib/crypto.js", () => ({
  encryptSecret: vi.fn((s: string) => `enc:${s}`),
  decryptSecret: vi.fn((s: string) => s.replace("enc:", "")),
}));

import { prisma } from "../lib/prisma.js";
import {
  createApiKey,
  lookupActiveKey,
  revokeApiKey,
} from "../lib/key-store.js";

const mockPrisma = prisma as unknown as {
  publicApiKey: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  publicApiProject: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

describe("createApiKey", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists encrypted secret and returns raw secret once", async () => {
    mockPrisma.publicApiKey.create.mockResolvedValue({
      id: "key-1",
      keyId: "pk_abc",
      clientId: "client-1",
      projectId: "proj-1",
      label: "Test",
      status: "ACTIVE",
      createdAt: new Date(),
    });

    const result = await createApiKey({
      clientId: "client-1",
      projectId: "proj-1",
      label: "Test",
      encryptionKey: "dummy-key",
    });

    expect(result.keyId).toMatch(/^pk_/);
    expect(result.keySecret).toMatch(/^sk_/);
    const createCall = mockPrisma.publicApiKey.create.mock.calls[0][0];
    expect(createCall.data.keySecretEnc).toMatch(/^enc:/);
    expect(createCall.data.keySecretEnc).not.toBe(result.keySecret);
  });
});

describe("lookupActiveKey", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null for unknown keyId", async () => {
    mockPrisma.publicApiKey.findUnique.mockResolvedValue(null);
    const result = await lookupActiveKey("pk_unknown", "dummy-key");
    expect(result).toBeNull();
  });

  it("returns null for REVOKED key", async () => {
    mockPrisma.publicApiKey.findUnique.mockResolvedValue({
      status: "REVOKED",
      keyId: "pk_abc",
      clientId: "client-1",
      keySecretEnc: "enc:sk_secret",
      expiresAt: null,
    });
    const result = await lookupActiveKey("pk_abc", "dummy-key");
    expect(result).toBeNull();
  });

  it("returns null for expired key", async () => {
    mockPrisma.publicApiKey.findUnique.mockResolvedValue({
      status: "ACTIVE",
      keyId: "pk_abc",
      clientId: "client-1",
      keySecretEnc: "enc:sk_secret",
      expiresAt: new Date(Date.now() - 1000),
    });
    const result = await lookupActiveKey("pk_abc", "dummy-key");
    expect(result).toBeNull();
  });

  it("returns decrypted keySecret for valid active key", async () => {
    mockPrisma.publicApiKey.findUnique.mockResolvedValue({
      status: "ACTIVE",
      keyId: "pk_abc",
      clientId: "client-1",
      keySecretEnc: "enc:sk_real_secret",
      expiresAt: null,
    });
    const result = await lookupActiveKey("pk_abc", "dummy-key");
    expect(result?.keySecret).toBe("sk_real_secret");
    expect(result?.clientId).toBe("client-1");
  });
});
