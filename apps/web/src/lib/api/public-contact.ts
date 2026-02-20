import type { ApiResponse, PublicContactRequestInput } from "@maphari/contracts";

const gatewayBaseUrl = process.env.NEXT_PUBLIC_GATEWAY_BASE_URL ?? "http://localhost:4000/api/v1";

export async function submitPublicContactRequest(
  payload: PublicContactRequestInput
): Promise<ApiResponse<{ accepted: boolean; leadId?: string }>> {
  const response = await fetch(`${gatewayBaseUrl}/public/contact-requests`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return (await response.json()) as ApiResponse<{ accepted: boolean; leadId?: string }>;
}
