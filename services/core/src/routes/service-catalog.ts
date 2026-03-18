// ════════════════════════════════════════════════════════════════════════════
// service-catalog.ts — Service packages, add-ons, retainer plans, and bundles
//
// Public / Portal routes (read-only):
//   GET  /public/services    — all active catalog data (no auth required)
//   GET  /portal/services    — same, for authenticated clients
//
// Admin routes (ADMIN role enforced at gateway):
//   GET|POST                /admin/services/packages
//   PATCH|DELETE            /admin/services/packages/:id
//   GET|POST                /admin/services/addons
//   PATCH|DELETE            /admin/services/addons/:id
//   GET|POST                /admin/services/retainers
//   PATCH|DELETE            /admin/services/retainers/:id
//   GET|POST                /admin/services/bundles
//   PATCH|DELETE            /admin/services/bundles/:id
// ════════════════════════════════════════════════════════════════════════════

import type { FastifyInstance } from "fastify";
import type { ApiResponse } from "@maphari/contracts";
import { prisma } from "../lib/prisma.js";

// ── Serializers ────────────────────────────────────────────────────────────────

function serializePackage(p: {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  priceMinCents: number;
  priceMaxCents: number;
  isCustomQuote: boolean;
  deliveryDays: string | null;
  paymentTerms: string | null;
  idealFor: string[];
  features: unknown;
  billingType: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id:            p.id,
    name:          p.name,
    slug:          p.slug,
    tagline:       p.tagline,
    priceMinCents: p.priceMinCents,
    priceMaxCents: p.priceMaxCents,
    isCustomQuote: p.isCustomQuote,
    deliveryDays:  p.deliveryDays,
    paymentTerms:  p.paymentTerms,
    idealFor:      p.idealFor,
    features:      p.features,
    billingType:   p.billingType,
    sortOrder:     p.sortOrder,
    isActive:      p.isActive,
    createdAt:     p.createdAt.toISOString(),
    updatedAt:     p.updatedAt.toISOString(),
  };
}

function serializeAddon(a: {
  id: string;
  category: string;
  name: string;
  description: string | null;
  priceMinCents: number;
  priceMaxCents: number;
  priceLabel: string | null;
  billingType: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id:            a.id,
    category:      a.category,
    name:          a.name,
    description:   a.description,
    priceMinCents: a.priceMinCents,
    priceMaxCents: a.priceMaxCents,
    priceLabel:    a.priceLabel,
    billingType:   a.billingType,
    isActive:      a.isActive,
    sortOrder:     a.sortOrder,
    createdAt:     a.createdAt.toISOString(),
    updatedAt:     a.updatedAt.toISOString(),
  };
}

function serializeRetainer(r: {
  id: string;
  name: string;
  description: string | null;
  priceMinCents: number;
  priceMaxCents: number;
  features: unknown;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id:            r.id,
    name:          r.name,
    description:   r.description,
    priceMinCents: r.priceMinCents,
    priceMaxCents: r.priceMaxCents,
    features:      r.features,
    sortOrder:     r.sortOrder,
    isActive:      r.isActive,
    createdAt:     r.createdAt.toISOString(),
    updatedAt:     r.updatedAt.toISOString(),
  };
}

function serializeBundle(b: {
  id: string;
  name: string;
  description: string | null;
  discountPct: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  packages: Array<{ package: { id: string; name: string; slug: string } }>;
}) {
  return {
    id:          b.id,
    name:        b.name,
    description: b.description,
    discountPct: b.discountPct,
    isActive:    b.isActive,
    sortOrder:   b.sortOrder,
    createdAt:   b.createdAt.toISOString(),
    updatedAt:   b.updatedAt.toISOString(),
    packages:    b.packages.map((bp) => ({ id: bp.package.id, name: bp.package.name, slug: bp.package.slug })),
  };
}

// ── Route registration ─────────────────────────────────────────────────────────

export async function registerServiceCatalogRoutes(app: FastifyInstance): Promise<void> {

  // ── Shared catalog loader ─────────────────────────────────────────────────

  async function loadActiveCatalog() {
    const [packages, addons, retainers, bundles] = await Promise.all([
      prisma.servicePackage.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.serviceAddon.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      }),
      prisma.retainerPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.serviceBundle.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { packages: { include: { package: { select: { id: true, name: true, slug: true } } } } },
      }),
    ]);

    return {
      packages:  packages.map(serializePackage),
      addons:    addons.map(serializeAddon),
      retainers: retainers.map(serializeRetainer),
      bundles:   bundles.map(serializeBundle),
    };
  }

  // ── GET /public/services ──────────────────────────────────────────────────

  app.get("/public/services", async (_req, reply) => {
    const catalog = await loadActiveCatalog();
    const response: ApiResponse<typeof catalog> = { success: true, data: catalog };
    return reply.status(200).send(response);
  });

  // ── GET /portal/services ──────────────────────────────────────────────────

  app.get("/portal/services", async (_req, reply) => {
    const catalog = await loadActiveCatalog();
    const response: ApiResponse<typeof catalog> = { success: true, data: catalog };
    return reply.status(200).send(response);
  });

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN — Packages
  // ════════════════════════════════════════════════════════════════════════

  app.get("/admin/services/packages", async (_req, reply) => {
    const packages = await prisma.servicePackage.findMany({
      orderBy: { sortOrder: "asc" },
    });
    const response: ApiResponse<ReturnType<typeof serializePackage>[]> = {
      success: true,
      data: packages.map(serializePackage),
    };
    return reply.status(200).send(response);
  });

  app.post<{ Body: Record<string, unknown> }>("/admin/services/packages", async (req, reply) => {
    const body = req.body ?? {};
    const pkg = await prisma.servicePackage.create({
      data: {
        name:          String(body.name ?? ""),
        slug:          String(body.slug ?? ""),
        tagline:       body.tagline ? String(body.tagline) : null,
        priceMinCents: Number(body.priceMinCents ?? 0),
        priceMaxCents: Number(body.priceMaxCents ?? 0),
        isCustomQuote: Boolean(body.isCustomQuote ?? false),
        deliveryDays:  body.deliveryDays ? String(body.deliveryDays) : null,
        paymentTerms:  body.paymentTerms ? String(body.paymentTerms) : null,
        idealFor:      Array.isArray(body.idealFor) ? (body.idealFor as string[]) : [],
        features:      body.features ?? [],
        billingType:   String(body.billingType ?? "ONCE_OFF"),
        sortOrder:     Number(body.sortOrder ?? 0),
        isActive:      body.isActive !== false,
      },
    });
    return reply.status(201).send({ success: true, data: serializePackage(pkg) });
  });

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/admin/services/packages/:id",
    async (req, reply) => {
      const body = req.body ?? {};
      const pkg = await prisma.servicePackage.update({
        where: { id: req.params.id },
        data: {
          ...(body.name          !== undefined && { name:          String(body.name) }),
          ...(body.slug          !== undefined && { slug:          String(body.slug) }),
          ...(body.tagline       !== undefined && { tagline:       body.tagline ? String(body.tagline) : null }),
          ...(body.priceMinCents !== undefined && { priceMinCents: Number(body.priceMinCents) }),
          ...(body.priceMaxCents !== undefined && { priceMaxCents: Number(body.priceMaxCents) }),
          ...(body.isCustomQuote !== undefined && { isCustomQuote: Boolean(body.isCustomQuote) }),
          ...(body.deliveryDays  !== undefined && { deliveryDays:  body.deliveryDays ? String(body.deliveryDays) : null }),
          ...(body.paymentTerms  !== undefined && { paymentTerms:  body.paymentTerms ? String(body.paymentTerms) : null }),
          ...(body.idealFor      !== undefined && { idealFor:      Array.isArray(body.idealFor) ? (body.idealFor as string[]) : [] }),
          ...(body.features      !== undefined && { features:      body.features ?? [] }),
          ...(body.billingType   !== undefined && { billingType:   String(body.billingType) }),
          ...(body.sortOrder     !== undefined && { sortOrder:     Number(body.sortOrder) }),
          ...(body.isActive      !== undefined && { isActive:      Boolean(body.isActive) }),
        },
      });
      return reply.status(200).send({ success: true, data: serializePackage(pkg) });
    }
  );

  app.delete<{ Params: { id: string } }>("/admin/services/packages/:id", async (req, reply) => {
    await prisma.servicePackage.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    return reply.status(200).send({ success: true, data: null });
  });

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN — Add-ons
  // ════════════════════════════════════════════════════════════════════════

  app.get("/admin/services/addons", async (_req, reply) => {
    const addons = await prisma.serviceAddon.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    return reply.status(200).send({ success: true, data: addons.map(serializeAddon) });
  });

  app.post<{ Body: Record<string, unknown> }>("/admin/services/addons", async (req, reply) => {
    const body = req.body ?? {};
    const addon = await prisma.serviceAddon.create({
      data: {
        category:      String(body.category ?? ""),
        name:          String(body.name ?? ""),
        description:   body.description ? String(body.description) : null,
        priceMinCents: Number(body.priceMinCents ?? 0),
        priceMaxCents: Number(body.priceMaxCents ?? 0),
        priceLabel:    body.priceLabel ? String(body.priceLabel) : null,
        billingType:   String(body.billingType ?? "ONCE_OFF"),
        sortOrder:     Number(body.sortOrder ?? 0),
        isActive:      body.isActive !== false,
      },
    });
    return reply.status(201).send({ success: true, data: serializeAddon(addon) });
  });

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/admin/services/addons/:id",
    async (req, reply) => {
      const body = req.body ?? {};
      const addon = await prisma.serviceAddon.update({
        where: { id: req.params.id },
        data: {
          ...(body.category      !== undefined && { category:      String(body.category) }),
          ...(body.name          !== undefined && { name:          String(body.name) }),
          ...(body.description   !== undefined && { description:   body.description ? String(body.description) : null }),
          ...(body.priceMinCents !== undefined && { priceMinCents: Number(body.priceMinCents) }),
          ...(body.priceMaxCents !== undefined && { priceMaxCents: Number(body.priceMaxCents) }),
          ...(body.priceLabel    !== undefined && { priceLabel:    body.priceLabel ? String(body.priceLabel) : null }),
          ...(body.billingType   !== undefined && { billingType:   String(body.billingType) }),
          ...(body.sortOrder     !== undefined && { sortOrder:     Number(body.sortOrder) }),
          ...(body.isActive      !== undefined && { isActive:      Boolean(body.isActive) }),
        },
      });
      return reply.status(200).send({ success: true, data: serializeAddon(addon) });
    }
  );

  app.delete<{ Params: { id: string } }>("/admin/services/addons/:id", async (req, reply) => {
    await prisma.serviceAddon.update({ where: { id: req.params.id }, data: { isActive: false } });
    return reply.status(200).send({ success: true, data: null });
  });

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN — Retainer Plans
  // ════════════════════════════════════════════════════════════════════════

  app.get("/admin/services/retainers", async (_req, reply) => {
    const retainers = await prisma.retainerPlan.findMany({ orderBy: { sortOrder: "asc" } });
    return reply.status(200).send({ success: true, data: retainers.map(serializeRetainer) });
  });

  app.post<{ Body: Record<string, unknown> }>("/admin/services/retainers", async (req, reply) => {
    const body = req.body ?? {};
    const retainer = await prisma.retainerPlan.create({
      data: {
        name:          String(body.name ?? ""),
        description:   body.description ? String(body.description) : null,
        priceMinCents: Number(body.priceMinCents ?? 0),
        priceMaxCents: Number(body.priceMaxCents ?? 0),
        features:      body.features ?? [],
        sortOrder:     Number(body.sortOrder ?? 0),
        isActive:      body.isActive !== false,
      },
    });
    return reply.status(201).send({ success: true, data: serializeRetainer(retainer) });
  });

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/admin/services/retainers/:id",
    async (req, reply) => {
      const body = req.body ?? {};
      const retainer = await prisma.retainerPlan.update({
        where: { id: req.params.id },
        data: {
          ...(body.name          !== undefined && { name:          String(body.name) }),
          ...(body.description   !== undefined && { description:   body.description ? String(body.description) : null }),
          ...(body.priceMinCents !== undefined && { priceMinCents: Number(body.priceMinCents) }),
          ...(body.priceMaxCents !== undefined && { priceMaxCents: Number(body.priceMaxCents) }),
          ...(body.features      !== undefined && { features:      body.features ?? [] }),
          ...(body.sortOrder     !== undefined && { sortOrder:     Number(body.sortOrder) }),
          ...(body.isActive      !== undefined && { isActive:      Boolean(body.isActive) }),
        },
      });
      return reply.status(200).send({ success: true, data: serializeRetainer(retainer) });
    }
  );

  app.delete<{ Params: { id: string } }>("/admin/services/retainers/:id", async (req, reply) => {
    await prisma.retainerPlan.update({ where: { id: req.params.id }, data: { isActive: false } });
    return reply.status(200).send({ success: true, data: null });
  });

  // ════════════════════════════════════════════════════════════════════════
  // ADMIN — Bundles
  // ════════════════════════════════════════════════════════════════════════

  app.get("/admin/services/bundles", async (_req, reply) => {
    const bundles = await prisma.serviceBundle.findMany({
      orderBy: { sortOrder: "asc" },
      include: { packages: { include: { package: { select: { id: true, name: true, slug: true } } } } },
    });
    return reply.status(200).send({ success: true, data: bundles.map(serializeBundle) });
  });

  app.post<{ Body: Record<string, unknown> }>("/admin/services/bundles", async (req, reply) => {
    const body = req.body ?? {};
    const packageIds = Array.isArray(body.packageIds) ? (body.packageIds as string[]) : [];
    const bundle = await prisma.serviceBundle.create({
      data: {
        name:        String(body.name ?? ""),
        description: body.description ? String(body.description) : null,
        discountPct: Number(body.discountPct ?? 0),
        sortOrder:   Number(body.sortOrder ?? 0),
        isActive:    body.isActive !== false,
        packages: {
          create: packageIds.map((packageId) => ({ packageId })),
        },
      },
      include: { packages: { include: { package: { select: { id: true, name: true, slug: true } } } } },
    });
    return reply.status(201).send({ success: true, data: serializeBundle(bundle) });
  });

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/admin/services/bundles/:id",
    async (req, reply) => {
      const body = req.body ?? {};
      const packageIds = Array.isArray(body.packageIds) ? (body.packageIds as string[]) : undefined;

      const bundle = await prisma.serviceBundle.update({
        where: { id: req.params.id },
        data: {
          ...(body.name        !== undefined && { name:        String(body.name) }),
          ...(body.description !== undefined && { description: body.description ? String(body.description) : null }),
          ...(body.discountPct !== undefined && { discountPct: Number(body.discountPct) }),
          ...(body.sortOrder   !== undefined && { sortOrder:   Number(body.sortOrder) }),
          ...(body.isActive    !== undefined && { isActive:    Boolean(body.isActive) }),
          ...(packageIds !== undefined && {
            packages: {
              deleteMany: {},
              create: packageIds.map((packageId) => ({ packageId })),
            },
          }),
        },
        include: { packages: { include: { package: { select: { id: true, name: true, slug: true } } } } },
      });
      return reply.status(200).send({ success: true, data: serializeBundle(bundle) });
    }
  );

  app.delete<{ Params: { id: string } }>("/admin/services/bundles/:id", async (req, reply) => {
    await prisma.serviceBundle.update({ where: { id: req.params.id }, data: { isActive: false } });
    return reply.status(200).send({ success: true, data: null });
  });
}
