import { BadRequestException, Body, Controller, Headers, Post } from "@nestjs/common";
import { submitOnboardingSchema, type ApiResponse, type Role } from "@maphari/contracts";
import { Roles } from "../auth/roles.decorator.js";
import { proxyRequest } from "../utils/proxy-request.js";

@Controller()
export class OnboardingController {
  @Roles("ADMIN", "STAFF", "CLIENT")
  @Post("onboarding/submissions")
  async submitOnboarding(
    @Body() body: unknown,
    @Headers("x-user-id") userId?: string,
    @Headers("x-user-role") role?: Role,
    @Headers("x-client-id") clientId?: string,
    @Headers("x-request-id") requestId?: string,
    @Headers("x-trace-id") traceId?: string
  ): Promise<ApiResponse> {
    const parsedBody = submitOnboardingSchema.safeParse(body);
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid onboarding submission payload");
    }

    const baseUrl = process.env.CORE_SERVICE_URL ?? "http://localhost:4002";
    return proxyRequest(`${baseUrl}/onboarding/submissions`, "POST", parsedBody.data, {
      "x-user-id": userId ?? "",
      "x-user-role": role ?? "CLIENT",
      "x-client-id": clientId ?? "",
      "x-request-id": requestId ?? "",
      "x-trace-id": traceId ?? requestId ?? ""
    });
  }
}
