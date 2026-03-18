// ════════════════════════════════════════════════════════════════════════════
// expenses.ts — Expense & ExpenseBudget routes
// Service : billing  |  Cache TTL: 60 s (GET), invalidate on write
// Scope   : ADMIN full access; STAFF sees/submits own expenses
// ════════════════════════════════════════════════════════════════════════════

// ── Imports ──────────────────────────────────────────────────────────────────
import type { ApiResponse } from "@maphari/contracts";
import type { FastifyInstance } from "fastify";
import type { Expense, ExpenseBudget } from "../generated/prisma/index.js";
import { prisma } from "../lib/prisma.js";
import { cache, CacheKeys } from "../lib/infrastructure.js";
import { readScopeHeaders } from "../lib/scope.js";

// ── DTOs ─────────────────────────────────────────────────────────────────────
type ExpenseDto = {
  id: string;
  clientId: string | null;
  category: string;
  subcategory: string | null;
  description: string;
  amountCents: number;
  submittedBy: string | null;
  status: string;
  hasReceipt: boolean;
  isBillable: boolean;
  expenseDate: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ExpenseBudgetDto = {
  id: string;
  category: string;
  budgetCents: number;
  spentCents: number;
  fiscalYear: number;
  createdAt: string;
  updatedAt: string;
};

function toExpenseDto(e: Expense): ExpenseDto {
  return {
    ...e,
    amountCents: Number(e.amountCents),
    expenseDate: e.expenseDate.toISOString(),
    approvedAt: e.approvedAt?.toISOString() ?? null,
    rejectedAt: e.rejectedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

function toBudgetDto(b: ExpenseBudget): ExpenseBudgetDto {
  return {
    ...b,
    budgetCents: Number(b.budgetCents),
    spentCents: Number(b.spentCents),
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────
export async function registerExpenseRoutes(app: FastifyInstance): Promise<void> {

  // ── GET /expenses ──────────────────────────────────────────────────────────
  app.get("/expenses", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const cacheKey = CacheKeys.expenses();

    try {
      const cached = await cache.getJson<ExpenseDto[]>(cacheKey);
      if (cached) {
        return { success: true, data: cached, meta: { requestId: scope.requestId, cache: "hit" } } as ApiResponse<ExpenseDto[]>;
      }

      const whereClause = scope.role === "STAFF" && scope.userId
        ? { submittedBy: scope.userId }
        : {};

      const expenses = await prisma.expense.findMany({
        where: whereClause,
        orderBy: { expenseDate: "desc" },
      });
      const data = expenses.map(toExpenseDto);

      if (scope.role !== "STAFF") await cache.setJson(cacheKey, data, 60);

      return { success: true, data, meta: { requestId: scope.requestId, cache: "miss" } } as ApiResponse<ExpenseDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "EXPENSES_FETCH_FAILED", message: "Unable to fetch expenses" } } as ApiResponse;
    }
  });

  // ── GET /expense-budgets ───────────────────────────────────────────────────
  app.get("/expense-budgets", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const cacheKey = CacheKeys.expenseBudgets();

    try {
      const cached = await cache.getJson<ExpenseBudgetDto[]>(cacheKey);
      if (cached) {
        return { success: true, data: cached, meta: { requestId: scope.requestId, cache: "hit" } } as ApiResponse<ExpenseBudgetDto[]>;
      }

      const budgets = await prisma.expenseBudget.findMany({ orderBy: { category: "asc" } });
      const data = budgets.map(toBudgetDto);

      await cache.setJson(cacheKey, data, 60);

      return { success: true, data, meta: { requestId: scope.requestId, cache: "miss" } } as ApiResponse<ExpenseBudgetDto[]>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "EXPENSE_BUDGETS_FETCH_FAILED", message: "Unable to fetch expense budgets" } } as ApiResponse;
    }
  });

  // ── POST /expenses ─────────────────────────────────────────────────────────
  app.post("/expenses", async (request, reply) => {
    const scope = readScopeHeaders(request);
    const body = request.body as {
      category: string;
      subcategory?: string;
      description: string;
      amountCents: number;
      clientId?: string;
      isBillable?: boolean;
      hasReceipt?: boolean;
      expenseDate?: string;
    };

    if (!body.category || !body.description || !body.amountCents) {
      reply.status(400);
      return { success: false, error: { code: "VALIDATION_ERROR", message: "category, description, and amountCents are required" } } as ApiResponse;
    }

    try {
      const expense = await prisma.expense.create({
        data: {
          category: body.category,
          subcategory: body.subcategory ?? null,
          description: body.description,
          amountCents: BigInt(Math.round(body.amountCents)),
          clientId: body.clientId ?? null,
          submittedBy: scope.userId ?? null,
          isBillable: body.isBillable ?? false,
          hasReceipt: body.hasReceipt ?? false,
          expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
          status: "PENDING",
        },
      });

      await cache.setJson(CacheKeys.expenses(), null as unknown as ExpenseDto[], 0);

      reply.status(201);
      return { success: true, data: toExpenseDto(expense) } as ApiResponse<ExpenseDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "EXPENSE_CREATE_FAILED", message: "Unable to create expense" } } as ApiResponse;
    }
  });

  // ── PATCH /expenses/:id/approve ────────────────────────────────────────────
  app.patch("/expenses/:id/approve", async (request, reply) => {
    const scope = readScopeHeaders(request);
    if (scope.role !== "ADMIN") {
      reply.status(403);
      return { success: false, error: { code: "FORBIDDEN", message: "Admin only" } } as ApiResponse;
    }

    const { id } = request.params as { id: string };
    const body = request.body as { action: "approve" | "reject" } | undefined;
    const action = body?.action ?? "approve";

    try {
      const expense = await prisma.expense.update({
        where: { id },
        data: {
          status: action === "approve" ? "APPROVED" : "REJECTED",
          approvedAt: action === "approve" ? new Date() : null,
          rejectedAt: action === "reject" ? new Date() : null,
        },
      });

      await cache.setJson(CacheKeys.expenses(), null as unknown as ExpenseDto[], 0);

      return { success: true, data: toExpenseDto(expense) } as ApiResponse<ExpenseDto>;
    } catch (error) {
      request.log.error(error);
      return { success: false, error: { code: "EXPENSE_APPROVE_FAILED", message: "Unable to update expense" } } as ApiResponse;
    }
  });
}
