import { Controller, Get } from "@nestjs/common";
import type { ApiResponse } from "@maphari/contracts";
import { Public } from "../auth/public.decorator.js";

interface ServiceHealth {
  name: string;
  status: "operational" | "degraded";
  latencyMs?: number;
}

interface StatusPayload {
  overall: "operational" | "degraded";
  services: ServiceHealth[];
  updatedAt: string;
}

const SERVICES: Array<{ name: string; url: string }> = [
  { name: "Core", url: `${process.env.CORE_SERVICE_URL ?? "http://localhost:4001"}/health` },
  { name: "Automation", url: `${process.env.AUTOMATION_SERVICE_URL ?? "http://localhost:4003"}/health` },
  { name: "AI", url: `${process.env.AI_SERVICE_URL ?? "http://localhost:4011"}/health` },
  { name: "Billing", url: `${process.env.BILLING_SERVICE_URL ?? "http://localhost:4002"}/health` }
];

async function pingService(name: string, url: string): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - start;
    return {
      name,
      status: res.status === 200 ? "operational" : "degraded",
      latencyMs
    };
  } catch {
    return { name, status: "degraded", latencyMs: Date.now() - start };
  }
}

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

  @Public()
  @Get("status")
  async status(): Promise<ApiResponse<StatusPayload>> {
    const services = await Promise.all(
      SERVICES.map((s) => pingService(s.name, s.url))
    );
    const overall: "operational" | "degraded" = services.some((s) => s.status === "degraded")
      ? "degraded"
      : "operational";
    return {
      success: true,
      data: {
        overall,
        services,
        updatedAt: new Date().toISOString()
      }
    };
  }
}
