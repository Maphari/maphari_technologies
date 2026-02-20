import type { ApiResponse } from "@maphari/contracts";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT";

export async function proxyRequest<TResponse = unknown, TBody = unknown>(
  url: string,
  method: HttpMethod,
  body?: TBody,
  headers: Record<string, string> = {}
): Promise<ApiResponse<TResponse>> {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "content-type": "application/json",
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const payload = (await response.json()) as ApiResponse<TResponse>;

    if (!response.ok) {
      const code = response.status === 401 ? "UPSTREAM_UNAUTHORIZED" : "UPSTREAM_ERROR";
      return {
        success: false,
        error: payload.error ?? {
          code,
          message: "Upstream request failed"
        }
      };
    }

    return payload;
  } catch {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNREACHABLE",
        message: "Gateway could not reach upstream service"
      }
    };
  }
}
