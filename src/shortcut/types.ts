export interface ShortcutMember {
  id: string;
  created_at: string;
  updated_at: string;
  role: string;
  profile: {
    id: string;
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
  };
  group_ids?: string[];
}

export interface ShortcutIteration {
  id: number;
  status: "unstarted" | "started" | "done";
  name: string;
  start_date: string;
  end_date: string;
  stats?: object;
  group_ids?: string[];
}

export interface ShortcutStory {
  id: number;
  app_url: string;
  name: string;
  description?: string;
  story_type: "feature" | "bug" | "chore";
  iteration_id?: number | null;
  workflow_state_id: number;
  owner_ids: string[];
  labels: { id: number; name: string; }[];
}

export interface ShortcutStorySearchResults {
  data: ShortcutStory[];
  next?: string | null;
}

export interface ShortcutGroup {
  app_url: string;
  archived: boolean;
  color: string | null;
  color_key: string | null;
  description: string;
  display_icon: {};
  entity_type: string;
  id: string;
  member_ids: number[];
  mention_name: string;
  name: string;
  num_epics_started: number;
  num_stories_started: number;
  workflow_ids: number[];
}

export interface ShortcutMemberInfo {
  id: string;
  name: string;
  mention_name: string;
}

export interface ShortcutEntitySearchData<T> {
  data: T[];
  next: string | null;
  total: number;
}

export interface ShortcutSearchResults {
  iterations?: ShortcutEntitySearchData<ShortcutIteration>;
  stories?: ShortcutEntitySearchData<ShortcutStory>;
  epics?: ShortcutEntitySearchData<any>;
  milestones?: ShortcutEntitySearchData<any>;
}

export interface ShortcutWorkflow {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  auto_assign_owner: boolean;
  default_state_id: number;
  project_ids: number[];
  states: ShortcutWorkflowState[];
  team_id: number;
}

export interface ShortcutWorkflowState {
  color: string;
  created_at: string;
  description: string;
  entity_type: string;
  id: number;
  name: string;
}
