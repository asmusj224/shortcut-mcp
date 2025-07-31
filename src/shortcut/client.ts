import dotenv from 'dotenv';
import type { 
  ShortcutMember, 
  ShortcutIteration, 
  ShortcutStory, 
  ShortcutGroup,
  ShortcutMemberInfo,
  ShortcutWorkflow
} from './types.js'; 

dotenv.config();

const SHORTCUT_API_TOKEN = process.env.SHORTCUT_API_TOKEN;
const SHORTCUT_API_URL = 'https://api.app.shortcut.com/api/v3';

if (!SHORTCUT_API_TOKEN) {
    console.error('Error: SHORTCUT_API_TOKEN environment variable is not set.');
    console.error('Please create an API token at https://app.shortcut.com/settings/api-tokens and set it as SHORTCUT_API_TOKEN.');
    process.exit(1); 
}

const apiToken: string = SHORTCUT_API_TOKEN;

async function shortcutFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${SHORTCUT_API_URL}${endpoint}`;
    console.error(`Fetching ${url}`);
    const headers = {
        'Content-Type': 'application/json',
        'Shortcut-Token': apiToken, // Use the asserted string type
        ...(options.headers || {}),
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Shortcut API Error (${response.status}): ${errorBody}`);
    }


    const data = await response.json();
    return data as T; 
}


async function getCurrentMemberInfo(): Promise<ShortcutMemberInfo> {
    try {
        return await shortcutFetch<ShortcutMemberInfo>('/member');
    } catch (error) {
        console.error("Error fetching current member info:", error);
        throw error; 
    }
}


async function getMemberById(memberId: string): Promise<ShortcutMember> {
    try {
        return await shortcutFetch<ShortcutMember>(`/members/${memberId}`);
    } catch (error) {
        console.error(`Error fetching member with ID ${memberId}:`, error);
        throw error;
    }
}

async function findCurrentIteration(groupId: string): Promise<ShortcutIteration | null> {
  try {

    const iterations = await shortcutFetch<ShortcutIteration[]>('/iterations'); 

    const startedIteration = iterations.find(iter => iter.status === 'started' && iter.group_ids?.includes(groupId));
    console.error(`Found ${iterations.length} iterations, first started iteration: ${startedIteration?.name}. ${startedIteration?.id}`);
    return startedIteration || null;
  } catch (error) {
    console.error("Error fetching iterations:", error);
    throw error;
  }
}

async function getCurrentIterationStories(): Promise<ShortcutStory[] | null> {
  try {
    
    const currentUser = await getCurrentMemberInfo();
    console.error("Current user:", currentUser);
    const user = await getMemberById(currentUser.id);
   
    const [groupId] = user.group_ids ?? []; 
    if (!groupId) {
      console.log("User does not belong to any group.");
      return null;
    }
    
    const currentIteration = await findCurrentIteration(groupId);

    if (!currentIteration) {
      return null; 
    }

    const iterationId = currentIteration.id;
    console.error(`Fetching stories for iteration ID: ${iterationId}`);

    const iterationStories = await shortcutFetch<ShortcutStory[]>(`/iterations/${iterationId}/stories`);
    return iterationStories.filter(story => story.owner_ids?.includes(currentUser.id));
  } catch (error) {
    console.error("Error getting stories in current iteration:", error);
    throw new Error("Failed to retrieve stories for the current iteration.");
  }
}


async function listGroups(): Promise<ShortcutGroup[]> {
  return shortcutFetch<ShortcutGroup[]>("/groups");
}


async function getCurrentUserWithGroups(): Promise<{ user: ShortcutMember; groups: ShortcutGroup[] }> {
  const memberInfo = await getCurrentMemberInfo();
  const userId = memberInfo.id;

  const [user, allGroups] = await Promise.all([
    getMemberById(userId),
    listGroups()
  ]);

  const userGroupIds = new Set(user.group_ids?.map(String) ?? []);
  const userGroups = allGroups.filter(group => userGroupIds.has(String(group.id)) && group.archived === false && !group.name.toLowerCase().includes("[do not use]"));

  return { user, groups: userGroups };
}

async function getEngineeringWorkflows(): Promise<ShortcutWorkflow> {
  return shortcutFetch<ShortcutWorkflow>("/workflows/500000005"); //todo: figure out how to not hardcode this
}


async function updateStoryWorkflowState(storyId: number, workflowStateId: number): Promise<ShortcutStory> {
  try {
    return await shortcutFetch<ShortcutStory>(
      `/stories/${storyId}`, 
      {
        method: 'PUT',
        body: JSON.stringify({ workflow_state_id: workflowStateId })
      }
    );
  } catch (error) {
    console.error(`Error updating story ${storyId} to workflow state ${workflowStateId}:`, error);
    throw error;
  }
}


async function createStory(storyData: {
  name: string;
  description?: string;
  workflow_state_id?: number;
  owner_ids?: string[];
  story_type?: 'feature' | 'bug' | 'chore';
}): Promise<ShortcutStory> {
  try {
    if (!storyData.owner_ids || storyData.owner_ids.length === 0) {
      const currentUser = await getCurrentMemberInfo();
      storyData.owner_ids = [currentUser.id];
    }


    if (!storyData.workflow_state_id) {
      const workflow = await getEngineeringWorkflows();
      const firstUnstartedState = workflow.states.find(s => 
        s.name.toLowerCase().includes('backlog: grooming')
      );
      
      if (firstUnstartedState) {
        storyData.workflow_state_id = firstUnstartedState.id;
      }
    }

    if (!storyData.story_type) {
      storyData.story_type = 'feature';
    }

    return await shortcutFetch<ShortcutStory>(
      `/stories`,
      {
        method: 'POST',
        body: JSON.stringify(storyData)
      }
    );
  } catch (error) {
    console.error(`Error creating story:`, error);
    throw error;
  }
}

async function getAllWorkflows(): Promise<ShortcutWorkflow[]> {
  return shortcutFetch<ShortcutWorkflow[]>("/workflows");
}

async function getStoryById(storyId: number): Promise<ShortcutStory> {
  return shortcutFetch<ShortcutStory>(`/stories/${storyId}`);
}

export {
    getCurrentUserWithGroups,
    getCurrentIterationStories,
    getEngineeringWorkflows,
    updateStoryWorkflowState,
    createStory,
    getAllWorkflows,
    getStoryById
}; 