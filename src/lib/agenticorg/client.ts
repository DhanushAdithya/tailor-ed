import { AgenticOrg, type AgenticOrgConfig } from "agenticorg-sdk";

export interface AgenticClientContext {
  client: AgenticOrg | null;
  isConfigured: boolean;
  baseUrl: string;
}

export interface ClientInitOptions {
  apiKey?: string;
  api_key?: string; // support snake_case from dashboard docs
  baseUrl?: string;
}

let cachedClient: AgenticOrg | null = null;

export function getAgenticOrgClient(options: ClientInitOptions = {}): AgenticClientContext {
  const apiKey =
    options.apiKey?.trim() ||
    options.api_key?.trim() ||
    process.env.AGENTICORG_API_KEY?.trim() ||
    process.env.API_KEY?.trim() ||
    "";

  const grantexToken = process.env.AGENTICORG_GRANTEX_TOKEN?.trim() || "";
  const baseUrl = (
    options.baseUrl?.trim() ||
    process.env.AGENTICORG_BASE_URL?.trim() ||
    "https://app.agenticorg.ai"
  ).replace(/\/$/, "");

  const isConfigured = Boolean(apiKey || grantexToken);

  if (!isConfigured) {
    return {
      client: null,
      isConfigured: false,
      baseUrl,
    };
  }

  // If a specific API key was provided via options, instantiate fresh client
  if (options.apiKey || options.api_key) {
    const client = new AgenticOrg({
      apiKey,
      baseUrl,
      timeout: 45000,
    });
    return {
      client,
      isConfigured: true,
      baseUrl,
    };
  }

  if (!cachedClient) {
    const config: AgenticOrgConfig = {
      apiKey: apiKey || undefined,
      grantexToken: grantexToken || undefined,
      baseUrl,
      timeout: 45000,
    };
    cachedClient = new AgenticOrg(config);
  }

  return {
    client: cachedClient,
    isConfigured: true,
    baseUrl,
  };
}
