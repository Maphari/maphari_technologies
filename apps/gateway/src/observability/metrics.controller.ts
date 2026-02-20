import { Controller, Get, Header } from "@nestjs/common";
import { Public } from "../auth/public.decorator.js";
import { MetricsService } from "./metrics.service.js";

@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Public()
  @Get("metrics")
  @Header("content-type", "text/plain; version=0.0.4")
  metrics(): string {
    return this.metricsService.renderPrometheus();
  }
}
