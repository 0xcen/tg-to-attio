export interface AttioCompanyId {
  workspace_id: string;
  object_id: string;
  record_id: string;
}

export interface AttioCompany {
  id: AttioCompanyId;
  values: {
    name: Array<{ value: string }>;
    domains?: Array<{ domain: string }>;
    locations?: Array<{
      locality?: string;
      region?: string;
      country?: string;
    }>;
  };
}

export interface AttioNote {
  id: {
    workspace_id: string;
    note_id: string;
  };
  title: string;
  content_plaintext?: string;
  content_markdown?: string;
  parent_object: string;
  parent_record_id: string;
  created_at: string;
}

export interface CreateNoteInput {
  parent_object: "companies";
  parent_record_id: string;
  title: string;
  format: "markdown" | "plaintext";
  content: string;
}

export interface SearchCompaniesInput {
  filter?: {
    name?: {
      $contains?: string;
    };
  };
  sorts?: Array<{
    attribute: string;
    field?: string;
    direction: "asc" | "desc";
  }>;
  limit?: number;
}

export interface CompanySearchResult {
  id: string;
  name: string;
  location?: string;
}
