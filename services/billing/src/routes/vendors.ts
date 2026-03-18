// ════════════════════════════════════════════════════════════════════════════
// vendors.ts — Vendor & VendorContract routes
// Service : billing  |  Cache TTL: 120 s (GET), invalidate on write
// Scope   : ADMIN only
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { Vendor, VendorContract } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTOs ─────────────────────────────────────────────────────────────────────
type VendorContractDto = {
  id: string;
  vendorId: string;
  startAt: string;
  endAt: string | null;
  valueCents: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type VendorDto = {
  id: string;
  name: string;
  category: string | null;
  contactName: string | null;
  contactEmail: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  contracts: VendorContractDto[];
};

function toContractDto(c: VendorContract): VendorContractDto {
  return {
    ...c,
    valueCents: Number(c.valueCents),
    startAt: c.startAt.toISOString(),
    endAt: c.endAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function toVendorDto(v: Vendor & { contracts?: VendorContract[] }): VendorDto {
  return {
    id: v.id,
    name: v.name,
    category: v.category,
    contactName: v.contactName,
    contactEmail: v.contactEmail,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    contracts: (v.contracts ?? []).map(toContractDto),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────
export async function registerVendorRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /vendors ───────────────────────────────────────────────────────────
  app.get("/vendors", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN" && scope.role !== "STAFF") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin or staff only" } } as ApiResponse;
    }

    const cacheKey = CacheKeys.vendors();

    try {
      const cached = await cache.getJson<VendorDto[]>(cacheKey);
      if (cached) {
        return { success: true, data: cached, meta: { requestId: scope.requestId, cache: "hit" } } as ApiResponse<VendorDto[]>;
      }

      const vendors = await prisma.vendor.findMany({
        include: { contracts: { orderBy: { startAt: "desc" } } },
        orderBy: { name: "asc" },
      });
      const data = vendors.map(toVendorDto);

      await cache.setJson(cacheKey, data, 120);

      return { success: true, data, meta: { requestId: scope.requestId, cache: "miss" } } as ApiResponse<VendorDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "VENDORS_FETCH_FAILED", message: "Unable to fetch vendors" } } as ApiResponse;
    }
  });

  // ── POST /vendors ──────────────────────────────────────────────────────────
  app.post("/vendors", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const body = request.body as {
      name: string;
      category?: string;
      contactName?: string;
      contactEmail?: string;
    };

    if (!body.name) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "name is required" } } as ApiResponse;
    }

    try {
      const vendor = await prisma.vendor.create({
        data: {
          name: body.name,
          category: body.category ?? null,
          contactName: body.contactName ?? null,
          contactEmail: body.contactEmail ?? null,
          status: "ACTIVE",
        },
        include: { contracts: true },
      });

      await cache.setJson(CacheKeys.vendors(), null as unknown as VendorDto[], 0);

      reply.status(201);
      return { success: true, data: toVendorDto(vendor) } as ApiResponse<VendorDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "VENDOR_CREATE_FAILED", message: "Unable to create vendor" } } as ApiResponse;
    }
  });

  // ── GET /vendors/:id/contracts ─────────────────────────────────────────────
  app.get("/vendors/:id/contracts", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const cacheKey = CacheKeys.vendorContracts(id);

    try {
      const cached = await cache.getJson<VendorContractDto[]>(cacheKey);
      if (cached) {
        return { success: true, data: cached, meta: { requestId: scope.requestId, cache: "hit" } } as ApiResponse<VendorContractDto[]>;
      }

      const contracts = await prisma.vendorContract.findMany({
        where: { vendorId: id },
        orderBy: { startAt: "desc" },
      });
      const data = contracts.map(toContractDto);

      await cache.setJson(cacheKey, data, 120);

      return { success: true, data, meta: { requestId: scope.requestId, cache: "miss" } } as ApiResponse<VendorContractDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "VENDOR_CONTRACTS_FETCH_FAILED", message: "Unable to fetch vendor contracts" } } as ApiResponse;
    }
  });

  // ── POST /vendors/:id/contracts ────────────────────────────────────────────
  app.post("/vendors/:id/contracts", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { id: vendorId } = request.params as { id: string };
    const body = request.body as {
      startAt: string;
      endAt?: string;
      valueCents: number;
      notes?: string;
    };

    if (!body.startAt || !body.valueCents) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "startAt and valueCents are required" } } as ApiResponse;
    }

    try {
      const contract = await prisma.vendorContract.create({
        data: {
          vendorId,
          startAt: new Date(body.startAt),
          endAt: body.endAt ? new Date(body.endAt) : null,
          valueCents: BigInt(Math.round(body.valueCents)),
          notes: body.notes ?? null,
          status: "ACTIVE",
        },
      });

      await cache.setJson(CacheKeys.vendors(), null as unknown as VendorDto[], 0);
      await cache.setJson(CacheKeys.vendorContracts(vendorId), null as unknown as VendorContractDto[], 0);

      reply.status(201);
      return { success: true, data: toContractDto(contract) } as ApiResponse<VendorContractDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "VENDOR_CONTRACT_CREATE_FAILED", message: "Unable to create vendor contract" } } as ApiResponse;
    }
  });
}
