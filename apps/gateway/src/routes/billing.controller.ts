import { BadRequestException, Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { createInvoiceSchema, createPaymentSchema, type ApiResponse, type Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class BillingController {
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
}
