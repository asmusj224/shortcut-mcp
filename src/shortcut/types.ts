// Define TypeScript types for Shortcut API objects here
// Example:
// export interface ShortcutStory {
//   id: number;
//   name: string;
//   description: string;
//   state_id: number;
//   // ... other relevant fields
// }

// export interface ShortcutIteration {
//   id: number;
//   name: string;
//   start_date: string;
//   end_date: string;
//   // ... other relevant fields
// }

// Add more types as needed (e.g., WorkflowState, Label, User, etc.)

export interface ShortcutMember {
  id: string; // UUID
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
  role: string;
  profile: {
    id: string; // UUID
    mention_name: string;
    email_address?: string | null;
    name?: string | null;
    gravatar_hash?: string | null;
    display_icon: {
      created_at: string;
      updated_at: string;
      url: string;
      entity_type: string;
      id: string;
      type: string;
    } | null;
    // There might be more fields depending on permissions
  };
  group_ids?: string[]; // Array of group UUIDs the member belongs to
  // Add other relevant fields if needed
}

export interface ShortcutIteration {
  id: number;
  status: "unstarted" | "started" | "done";
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  stats?: object; // Contains various stats like num_stories_unstarted, etc.
  group_ids?: string[]; // Array of group UUIDs the iteration belongs to
  // Add other relevant fields as needed
}

// Basic Story definition - Add more fields as required by your use case
export interface ShortcutStory {
  id: number;
  app_url: string;
  name: string;
  description?: string;
  story_type: "feature" | "bug" | "chore";
  iteration_id?: number | null;
  workflow_state_id: number;
  owner_ids: string[]; // Array of UUIDs
  labels: { id: number; name: string; /* ... other label fields */ }[];
  // Add other relevant fields like project_id, completed_at, started_at, etc.
}

// Type for the paginated response from /search/stories
export interface ShortcutStorySearchResults {
  data: ShortcutStory[];
  next?: string | null; // URL for the next page or null if last page
  // total?: number; // Total results, might not always be present
}

export interface ShortcutGroup {
  app_url: string;
  archived: boolean;
  color: string | null;
  color_key: string | null;
  description: string;
  display_icon: { /* Define if needed, often contains URLs */ };
  entity_type: string;
  id: string; // UUID
  member_ids: number[]; // Or string[] depending on API
  mention_name: string;
  name: string;
  num_epics_started: number;
  num_stories_started: number;
  workflow_ids: number[]; // Or string[] depending on API
}

/**
 * Represents basic information about a member, typically returned by /api/v3/member.
 */
export interface ShortcutMemberInfo {
  id: string; // UUID
  name: string;
  mention_name: string;
  // Add other relevant fields from MemberInfo if needed, but ID is the crucial one for now
}

/**
 * Represents a Shortcut Member (User).
 * Fetched via /api/v3/members/{member-public-id}
 */

/**
 * Represents the structure within a specific entity type's search result
 * from the general /search endpoint.
 */
export interface ShortcutEntitySearchData<T> {
  data: T[];
  next: string | null; // URL for the next page, or null
  total: number;
}

/**
 * Represents the overall response structure from the GET /api/v3/search endpoint.
 * It contains keys for the requested entity types.
 */
export interface ShortcutSearchResults {
  iterations?: ShortcutEntitySearchData<ShortcutIteration>;
  stories?: ShortcutEntitySearchData<ShortcutStory>;
  epics?: ShortcutEntitySearchData<any>; // Define fully if needed
  milestones?: ShortcutEntitySearchData<any>; // Define fully if needed
  // Add other entity types as needed
} 