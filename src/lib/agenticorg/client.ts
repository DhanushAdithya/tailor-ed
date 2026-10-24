import { AgenticOrg, type AgenticOrgConfig } from "agenticorg-sdk";

export interface AgenticClientContext {
  client: AgenticOrg | null;
  isConfigured: boolean;
  baseUrl: string;
}

let cachedClient: AgenticOrg | null = null;

export function getAgenticOrgClient(): AgenticClientContext {
  const apiKey = process.env.AGENTICORG_API_KEY?.trim() || "";
  const grantexToken = process.env.AGENTICORG_GRANTEX_TOKEN?.trim() || "";
  const baseUrl = (process.env.AGENTICORG_BASE_URL?.trim() || "https://app.agenticorg.ai").replace(/\/$/, "");

  const isConfigured = Boolean(apiKey || grantexToken);

  if (!isConfigured) {
    return {
      client: null,
      isConfigured: false,
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
