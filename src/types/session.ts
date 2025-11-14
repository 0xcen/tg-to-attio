import type { ForwardedMessageData } from "../services/attio/formatters.js";
import type { CompanySearchResult } from "../services/attio/types.js";

export type BotState = "idle" | "awaiting_company_search" | "awaiting_company_selection" | "awaiting_confirmation";

export interface SessionData {
  messageQueue: ForwardedMessageData[];
  selectedCompanyId?: string;
  selectedCompanyName?: string;
  searchResults?: CompanySearchResult[];
  recentCompanies?: CompanySearchResult[];
  state?: BotState;
}
