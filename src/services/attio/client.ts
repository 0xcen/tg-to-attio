import { config } from "../../lib/config.js";
import { logger } from "../../lib/logger.js";
import type {
  AttioCompany,
  AttioNote,
  CreateNoteInput,
  SearchCompaniesInput,
  CompanySearchResult,
} from "./types.js";

export class AttioClient {
  private baseUrl = config.attio.baseUrl;
  private apiKey = config.attioApiKey;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    try {
      logger.debug("Attio API request", { endpoint, method: options.method || "GET" });
      
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error("Attio API error", {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
        });
        throw new Error(`Attio API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as T;
      return data;
    } catch (error) {
      logger.error("Attio API request failed", {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async searchCompanies(query: string): Promise<CompanySearchResult[]> {
    const searchInput: SearchCompaniesInput = {
      filter: {
        name: {
          $contains: query,
        },
      },
      limit: config.conversation.maxSearchResults + 5,
    };

    logger.info("Searching companies", { query });

    const response = await this.request<{ data: AttioCompany[] }>(
      `/objects/${config.attio.companiesObject}/records/query`,
      {
        method: "POST",
        body: JSON.stringify(searchInput),
      }
    );

    const results: CompanySearchResult[] = response.data.map((company) => {
      const name = company.values.name?.[0]?.value || "Unnamed Company";
      
      let location: string | undefined;
      const locationData = company.values.locations?.[0];
      if (locationData) {
        const parts = [
          locationData.locality,
          locationData.region,
          locationData.country,
        ].filter(Boolean);
        location = parts.length > 0 ? parts.join(", ") : undefined;
      }

      return {
        id: company.id.record_id,
        name,
        location,
      };
    });

    logger.info("Company search results", { query, count: results.length });
    return results;
  }

  async getCompanyById(recordId: string): Promise<AttioCompany> {
    logger.info("Fetching company by ID", { recordId });

    const response = await this.request<{ data: AttioCompany }>(
      `/objects/${config.attio.companiesObject}/records/${recordId}`,
      {
        method: "GET",
      }
    );

    return response.data;
  }

  async createNote(input: CreateNoteInput): Promise<AttioNote> {
    logger.info("Creating note", {
      parentObject: input.parent_object,
      parentRecordId: input.parent_record_id,
      title: input.title,
    });

    const response = await this.request<{ data: AttioNote }>("/notes", {
      method: "POST",
      body: JSON.stringify({
        data: input,
      }),
    });

    logger.info("Note created successfully", {
      noteId: response.data.id.note_id,
    });

    return response.data;
  }

  async createNotesForMessages(
    companyRecordId: string,
    messages: Array<{ title: string; content: string }>
  ): Promise<AttioNote[]> {
    logger.info("Creating batch notes", {
      companyRecordId,
      messageCount: messages.length,
    });

    const notes: AttioNote[] = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const note = await this.createNote({
        parent_object: "companies",
        parent_record_id: companyRecordId,
        title: message.title,
        format: "markdown",
        content: message.content,
      });
      notes.push(note);
      
      logger.debug(`Created note ${i + 1}/${messages.length}`);
    }

    logger.info("Batch notes created successfully", {
      companyRecordId,
      notesCreated: notes.length,
    });

    return notes;
  }
}

export const attioClient = new AttioClient();
