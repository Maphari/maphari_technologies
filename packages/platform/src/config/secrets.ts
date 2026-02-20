export interface SecretProvider {
  getSecret: (name: string) => Promise<string | undefined>;
}

export interface VaultHttpProviderOptions {
  baseUrl: string;
  token: string;
  mountPath?: string;
}

/**
 * Reads secrets from process environment.
 */
export class EnvSecretProvider implements SecretProvider {
  async getSecret(name: string): Promise<string | undefined> {
    const value = process.env[name];
    return value && value.length > 0 ? value : undefined;
  }
}

/**
 * Vault-compatible HTTP provider that can be composed with env fallback.
 */
export class VaultHttpSecretProvider implements SecretProvider {
  constructor(private readonly options: VaultHttpProviderOptions) {}

  async getSecret(name: string): Promise<string | undefined> {
    const mountPath = this.options.mountPath ?? "secret/data/maphari";
    const url = `${this.options.baseUrl.replace(/\/$/, "")}/v1/${mountPath}/${encodeURIComponent(name)}`;
    const response = await fetch(url, {
      headers: {
        "x-vault-token": this.options.token
      }
    });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as {
      data?: { data?: Record<string, string> };
    };
    return payload.data?.data?.value;
  }
}

/**
 * Lookup order: primary provider first, then fallback provider.
 */
export class ChainedSecretProvider implements SecretProvider {
  constructor(
    private readonly primary: SecretProvider,
    private readonly fallback?: SecretProvider
  ) {}

  async getSecret(name: string): Promise<string | undefined> {
    const primaryValue = await this.primary.getSecret(name);
    if (primaryValue !== undefined) return primaryValue;
    return this.fallback?.getSecret(name);
  }
}
