import { signWebhookPayload } from "@maphari/platform";

interface CrmInput {
  eventId: string;
  payload: unknown;
}

export interface CrmAdapter {
  upsertLead(input: CrmInput): Promise<void>;
  updatePipelineStage(input: CrmInput): Promise<void>;
  tagLead(input: CrmInput): Promise<void>;
  createBookingPipelineEntry(input: CrmInput): Promise<void>;
  generateInvoiceFromProposal(input: CrmInput): Promise<void>;
  createProjectFromProposal(input: CrmInput): Promise<void>;
  assignOnboardingTasks(input: CrmInput): Promise<void>;
  createProjectFromPayment(input: CrmInput): Promise<void>;
  markInvoicePaid(input: CrmInput): Promise<void>;
}

interface CrmAdapterConfig {
  provider: "noop" | "webhook";
  webhookUrl?: string;
  apiKey?: string;
  signingSecret?: string;
}

interface LoggerLike {
  info(payload: Record<string, unknown>, message: string): void;
}

async function postWebhook(
  url: string,
  apiKey: string | undefined,
  signingSecret: string | undefined,
  operation:
    | "upsertLead"
    | "updatePipelineStage"
    | "tagLead"
    | "createBookingPipelineEntry"
    | "generateInvoiceFromProposal"
    | "createProjectFromProposal"
    | "assignOnboardingTasks"
    | "createProjectFromPayment"
    | "markInvoicePaid",
  input: CrmInput
): Promise<void> {
  const serialized = JSON.stringify({
    provider: "crm",
    operation,
    ...input
  });
  const timestamp = String(Date.now());
  const signature = signingSecret ? signWebhookPayload(`${timestamp}.${serialized}`, signingSecret) : undefined;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      ...(signature ? { "x-maphari-signature": signature, "x-maphari-timestamp": timestamp } : {})
    },
    body: serialized
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CRM webhook failed (${response.status}): ${text || response.statusText}`);
  }
}

export function createCrmAdapter(config: CrmAdapterConfig, logger: LoggerLike): CrmAdapter {
  if (config.provider === "webhook" && config.webhookUrl) {
    return {
      async upsertLead(input: CrmInput): Promise<void> {
        await postWebhook(config.webhookUrl as string, config.apiKey, config.signingSecret, "upsertLead", input);
      },
      async updatePipelineStage(input: CrmInput): Promise<void> {
        await postWebhook(config.webhookUrl as string, config.apiKey, config.signingSecret, "updatePipelineStage", input);
      },
      async tagLead(input: CrmInput): Promise<void> {
        await postWebhook(config.webhookUrl as string, config.apiKey, config.signingSecret, "tagLead", input);
      },
      async createBookingPipelineEntry(input: CrmInput): Promise<void> {
        await postWebhook(config.webhookUrl as string, config.apiKey, config.signingSecret, "createBookingPipelineEntry", input);
      },
      async generateInvoiceFromProposal(input: CrmInput): Promise<void> {
        await postWebhook(config.webhookUrl as string, config.apiKey, config.signingSecret, "generateInvoiceFromProposal", input);
      },
      async createProjectFromProposal(input: CrmInput): Promise<void> {
        await postWebhook(config.webhookUrl as string, config.apiKey, config.signingSecret, "createProjectFromProposal", input);
      },
      async assignOnboardingTasks(input: CrmInput): Promise<void> {
        await postWebhook(config.webhookUrl as string, config.apiKey, config.signingSecret, "assignOnboardingTasks", input);
      },
      async createProjectFromPayment(input: CrmInput): Promise<void> {
        await postWebhook(config.webhookUrl as string, config.apiKey, config.signingSecret, "createProjectFromPayment", input);
      },
      async markInvoicePaid(input: CrmInput): Promise<void> {
        await postWebhook(config.webhookUrl as string, config.apiKey, config.signingSecret, "markInvoicePaid", input);
      }
    };
  }

  const logNoop = async (operation: string, input: CrmInput): Promise<void> => {
    logger.info(
      {
        provider: "crm.noop",
        operation,
        eventId: input.eventId
      },
      "crm adapter noop operation"
    );
  };

  return {
    upsertLead: (input) => logNoop("upsertLead", input),
    updatePipelineStage: (input) => logNoop("updatePipelineStage", input),
    tagLead: (input) => logNoop("tagLead", input),
    createBookingPipelineEntry: (input) => logNoop("createBookingPipelineEntry", input),
    generateInvoiceFromProposal: (input) => logNoop("generateInvoiceFromProposal", input),
    createProjectFromProposal: (input) => logNoop("createProjectFromProposal", input),
    assignOnboardingTasks: (input) => logNoop("assignOnboardingTasks", input),
    createProjectFromPayment: (input) => logNoop("createProjectFromPayment", input),
    markInvoicePaid: (input) => logNoop("markInvoicePaid", input)
  };
}
