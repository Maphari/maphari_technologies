import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { ApiResponse } from "@maphari/contracts";
import { randomUUID } from "node:crypto";
import { map, type Observable } from "rxjs";

type HeaderValue = string | string[] | undefined;

function extractHeaderValue(value: HeaderValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, HeaderValue> }>();
    const reply = context.switchToHttp().getResponse<{ header: (key: string, value: string) => void }>();

    const requestId = extractHeaderValue(request.headers["x-request-id"]) ?? randomUUID();
    const traceId = extractHeaderValue(request.headers["x-trace-id"]) ?? requestId;
    request.headers["x-request-id"] = requestId;
    request.headers["x-trace-id"] = traceId;
    reply.header("x-request-id", requestId);
    reply.header("x-trace-id", traceId);

    return next.handle().pipe(
      map((payload: unknown) => {
        if (!payload || typeof payload !== "object") {
          return payload;
        }

        const apiPayload = payload as ApiResponse;
        const meta = apiPayload.meta ?? {};
        return { ...apiPayload, meta: { ...meta, requestId, traceId } };
      })
    );
  }
}
