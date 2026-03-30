import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createInvoiceSchema,
  createPaymentSchema,
  sendInvoiceReminderSchema,
  upsertInvoiceReminderPreferenceSchema,
  type ApiResponse,
  type Role
} from "@maphari/contracts";
import { Public } from "../auth/public.decorator.js";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class BillingController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("invoice-reminders/preferences")
  async getInvoiceReminderPreferences(
    @Query("clientId") clientIdQuery?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    const query = clientIdQuery ? "?clientId=" + encodeURIComponent(clientIdQuery) : "";
    return proxyRequest(`${baseUrl}/invoice-reminders/preferences${query}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("invoice-reminders/preferences")
  async saveInvoiceReminderPreferences(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = upsertInvoiceReminderPreferenceSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid invoice reminder preference payload");
    }

    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/invoice-reminders/preferences`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("invoice-reminders/send")
  async sendInvoiceReminders(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = sendInvoiceReminderSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid invoice reminder payload");
    }

    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/invoice-reminders/send`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("invoices")
  async listInvoices(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/invoices`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("invoices")
  async createInvoice(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createInvoiceSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid invoice payload");
    }

    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/invoices`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("payments")
  async listPayments(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/payments`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("payments")
  async createPayment(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = createPaymentSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid payment payload");
    }

    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/payments`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /invoices/:id ─────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("invoices/:id")
  async getInvoice(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/invoices/${id}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── PATCH /invoices/:id ───────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Patch("invoices/:id")
  async patchInvoice(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/invoices/${id}`, "PATCH", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /invoices/:id/pdf ─────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("invoices/:id/pdf")
  async getInvoicePdf(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/invoices/${id}/pdf`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /payments/:id/receipt ─────────────────────────────────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("payments/:id/receipt")
  async getPaymentReceipt(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/payments/${id}/receipt`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /vendors ─────────────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("vendors")
  async listVendors(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/vendors`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /loyalty/redeem ──────────────────────────────────────────────────
  @Roles("CLIENT")
  @Post("loyalty/redeem")
  async redeemLoyalty(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/loyalty/redeem`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /loyalty — list all accounts (ADMIN) ──────────────────────────────
  @Roles("ADMIN")
  @Get("loyalty")
  async listLoyaltyAccounts(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/loyalty`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /loyalty/:clientId — single account (CLIENT own / ADMIN) ──────────
  @Roles("ADMIN", "CLIENT")
  @Get("loyalty/:clientId")
  async getLoyaltyAccount(
    @Param("clientId") clientIdParam: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/loyalty/${clientIdParam}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /loyalty/:clientId/transactions — issue credits (ADMIN) ──────────
  @Roles("ADMIN")
  @Post("loyalty/:clientId/transactions")
  async issueLoyaltyCredits(
    @Param("clientId") clientIdParam: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/loyalty/${clientIdParam}/transactions`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /expenses — list expenses (ADMIN/STAFF) ───────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("expenses")
  async listExpenses(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/expenses`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /expenses — submit expense (ADMIN/STAFF) ─────────────────────────
  @Roles("ADMIN", "STAFF")
  @Post("expenses")
  async createExpense(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/expenses`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── PATCH /expenses/:id/approve — approve/reject (ADMIN) ──────────────────
  @Roles("ADMIN")
  @Patch("expenses/:id/approve")
  async approveExpense(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/expenses/${id}/approve`, "PATCH", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /expense-budgets ───────────────────────────────────────────────────
  @Roles("ADMIN", "STAFF")
  @Get("expense-budgets")
  async listExpenseBudgets(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/expense-budgets`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /invoices/overdue-chase-status ───────────────────────────────────
  @Roles("ADMIN")
  @Get("invoices/overdue-chase-status")
  async getOverdueChaseStatus(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/invoices/overdue-chase-status`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /invoices/:id/chase ──────────────────────────────────────────────
  @Roles("ADMIN")
  @Post("invoices/:id/chase")
  async chaseInvoice(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/invoices/${id}/chase`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Get("admin/revenue-series")
  async revenueSeries(
    @Query("months") months?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    const qs = months ? `?months=${encodeURIComponent(months)}` : "";
    return proxyRequest(`${baseUrl}/admin/revenue-series${qs}`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  @Roles("ADMIN", "STAFF")
  @Get("admin/cash-flow-events")
  async cashFlowEvents(
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/admin/cash-flow-events`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "ADMIN",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /payfast/initiate — CLIENT initiates PayFast payment ────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("payfast/initiate")
  async initiatePayment(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/payfast/initiate`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /payfast/itn — PayFast ITN webhook (no auth — external server) ──
  @Public()
  @Post("payfast/itn")
  async payfastItn(
    @Body() body: unknown,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/payfast/itn`, "POST", body as Record<string, unknown>, {
      "x-user-id": "",
      "x-user-role": "CLIENT",
      "x-client-id": "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /invoices/:id/installments — list installments ───────────────────
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Get("invoices/:id/installments")
  async listInstallments(
    @Param("id") id: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/invoices/${id}/installments`, "GET", undefined, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── POST /invoices/:id/installments — create installment (ADMIN/STAFF) ───
  @Roles("ADMIN", "STAFF")
  @Post("invoices/:id/installments")
  async createInstallment(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/invoices/${id}/installments`, "POST", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── PATCH /installments/:id/pay — mark installment paid (ADMIN/STAFF) ────
  @Roles("ADMIN", "STAFF")
  @Patch("installments/:id/pay")
  async payInstallment(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/installments/${id}/pay`, "PATCH", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── PATCH /payments/:id — update payment (ADMIN/STAFF) ───────────────────
  @Roles("ADMIN", "STAFF")
  @Patch("payments/:id")
  async updatePayment(
    @Param("id") id: string,
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    return proxyRequest(`${baseUrl}/payments/${id}`, "PATCH", body as Record<string, unknown>, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "STAFF",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }

  // ── GET /analytics/mrr-history ────────────────────────────────────────────
  @Roles("ADMIN")
  @Get("analytics/mrr-history")
  async getMrrHistory(
    @Query("months") months?: string,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const baseUrl = process.env.BILLING_SERVICE_URL ?? "http://localhost:4006";
    const query = months ? `?months=${encodeURIComponent(months)}` : "";
    return proxyRequest(`${baseUrl}/analytics/mrr-history${query}`, "GET", undefined, {
      "x-user-id":    userId    ?? "",
      "x-user-role":  role      ?? "ADMIN",
      "x-client-id":  clientId  ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id":   traceId   ?? requestId ?? ""
    });
  }
}
