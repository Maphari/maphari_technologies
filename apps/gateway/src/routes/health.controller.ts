import { Controller, Get } from "@nestjs/common";
import type { ApiResponse } from "@maphari/contracts";
import { Public } from "../auth/public.decorator.js";

@Controller()
export class HealthController {
  @Public()
  @Get("health")
  health(): ApiResponse<{ service: string; status: string }> {
    return {
      success: true,
      data: {
        service: "gateway",
        status: "ok"
      }
    };
  }
}
