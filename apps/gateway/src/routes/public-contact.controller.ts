import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Headers,
  InternalServerErrorException,
  Post
} from "@nestjs/common";
import { publicContactRequestSchema, type ApiResponse } from "@maphari/contracts";
import { Public } from "../auth/public.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

function originAllowed(origin: string | undefined, allowListRaw: string | undefined): boolean {
  if (!allowListRaw || allowListRaw.trim().length === 0) return true;
  if (!origin) return false;

  const allowList = allowListRaw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (allowList.length === 0) return true;
  return allowList.includes(origin);
}

@Controller()
export class PublicContactController {
  @Public()
  @Post("public/contact-requests")
  async submitContactRequest(
    @Body() body: unknown,
    @Headers("origin") origin?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse<{ accepted: boolean; leadId?: string }>> {
    const parsedBody = publicContactRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid contact request payload");
    }

    if (!originAllowed(origin, process.env.PUBLIC_CONTACT_ALLOWED_ORIGINS)) {
      throw new ForbiddenException("Origin not allowed");
    }

    if (parsedBody.data.company && parsedBody.data.company.trim().length > 0) {
      return {
        success: true,
        data: { accepted: true },
        meta: { requestId }
      };
    }

    if (parsedBody.data.startedAt) {
      const startedAtMs = Date.parse(parsedBody.data.startedAt);
      if (Number.isFinite(startedAtMs) && Date.now() - startedAtMs < 1500) {
        throw new BadRequestException("Form submitted too quickly");
      }
    }

    const defaultClientId = process.env.PUBLIC_CONTACT_CLIENT_ID;
    if (!defaultClientId) {
      throw new InternalServerErrorException("PUBLIC_CONTACT_CLIENT_ID is not configured");
    }

    const leadPayload = {
      clientId: defaultClientId,
      title: `${parsedBody.data.service} inquiry from ${parsedBody.data.name}`,
      source: "WEBSITE_CONTACT",
      contactName: parsedBody.data.name,
      contactEmail: parsedBody.data.email,
      company: parsedBody.data.company,
      notes: [
        `Name: ${parsedBody.data.name}`,
        `Email: ${parsedBody.data.email}`,
        `Service: ${parsedBody.data.service}`,
        `Page: ${parsedBody.data.pagePath ?? "unknown"}`,
        "",
        parsedBody.data.message
      ].join("\n")
    };

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    const upstream = await proxyRequest<{ id: string }>(`${baseUrl}/leads`, "POST", leadPayload, {
      "x-user-id": "public-contact",
      "x-user-role": "STAFF",
      "x-client-id": defaultClientId,
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });

    if (!upstream.success) {
      return {
        success: false,
        error: upstream.error,
        meta: upstream.meta
      };
    }

    return {
      success: true,
      data: {
        accepted: true,
        leadId: upstream.data?.id
      },
      meta: upstream.meta
    };
  }
}
