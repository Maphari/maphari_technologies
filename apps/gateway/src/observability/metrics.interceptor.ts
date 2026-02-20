import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, type Observable } from "rxjs";
import { MetricsService } from "./metrics.service.js";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService = new MetricsService()) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<{ method: string; route?: { path?: string }; url: string; __start?: number }>();
    const reply = context.switchToHttp().getResponse<{ statusCode: number }>();

    request.__start = Date.now();

    return next.handle().pipe(
      map((payload) => {
        const durationMs = Date.now() - (request.__start ?? Date.now());
        const route = request.route?.path ?? request.url;
        this.metricsService.incRequest({
          method: request.method,
          route,
          status: reply.statusCode
        });
        this.metricsService.observeDuration(durationMs, {
          method: request.method,
          route
        });
        return payload;
      })
    );
  }
}
