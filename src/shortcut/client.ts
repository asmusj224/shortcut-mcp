import dotenv from 'dotenv';
import type { 
  ShortcutMember, 
  ShortcutIteration, 
  ShortcutStory, 
  ShortcutStorySearchResults,
  ShortcutGroup,
  ShortcutMemberInfo
} from './types.js'; // Import necessary types

dotenv.config(); // Load environment variables from .env file

const SHORTCUT_API_TOKEN = process.env.SHORTCUT_API_TOKEN;
const SHORTCUT_API_URL = 'https://api.app.shortcut.com/api/v3';

if (!SHORTCUT_API_TOKEN) {
    console.error('Error: SHORTCUT_API_TOKEN environment variable is not set.');
    console.error('Please create an API token at https://app.shortcut.com/settings/api-tokens and set it as SHORTCUT_API_TOKEN.');
    process.exit(1); // Exit if the token is missing
}

// Assert that the token is a string after the check
const apiToken: string = SHORTCUT_API_TOKEN;

// Basic fetch function with authorization header
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

    // Handle cases where there might be no content (e.g., 204 No Content)
    if (response.status === 204) {
        // For 204, we technically shouldn't parse JSON.
        // Return null or an appropriate empty value depending on expected T.
        // Casting to T might be unsafe if T isn't expecting null/undefined.
        // Consider refining this based on how 204 is used in the API.
        return null as T; 
    }

    const data = await response.json();
    return data as T; // Return the parsed JSON data, cast to type T
}

// --- Shortcut API Functions ---

/**
 * Fetches basic information about the current user (API token owner).
 * @returns {Promise<ShortcutMemberInfo>} A promise that resolves to the basic member info object.
 */
async function getCurrentMemberInfo(): Promise<ShortcutMemberInfo> {
    try {
        // Use the correct endpoint and type
        return await shortcutFetch<ShortcutMemberInfo>('/member');
    } catch (error) {
        console.error("Error fetching current member info:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
}

/**
 * Fetches detailed information for a specific member by their ID.
 * @param {string} memberId - The UUID of the member.
 * @returns {Promise<ShortcutMember>} A promise that resolves to the full member object.
 */
async function getMemberById(memberId: string): Promise<ShortcutMember> {
    try {
        return await shortcutFetch<ShortcutMember>(`/members/${memberId}`);
    } catch (error) {
        console.error(`Error fetching member with ID ${memberId}:`, error);
        throw error;
    }
}

/**
 * Finds the first active ("started") iteration.
 * @returns {Promise<ShortcutIteration | null>} The first started iteration found, or null.
 */
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

/**
 * Gets all stories within the currently active iteration for the user's primary group.
 * @returns {Promise<ShortcutStory[] | null>} Stories if found, null if no active iteration exists.
 */
async function getCurrentIterationStories(): Promise<ShortcutStory[] | null> {
  try {
    // Need the user's group to find the right iteration
    const currentUser = await getCurrentMemberInfo();
    console.error("Current user:", currentUser);
    const user = await getMemberById(currentUser.id);
    // Assuming the first group ID is the primary one for iterations
    const [groupId] = user.group_ids ?? []; 
    if (!groupId) {
      console.log("User does not belong to any group.");
      return null;
    }
    
    const currentIteration = await findCurrentIteration(groupId);

    if (!currentIteration) {
      console.log("No active iteration found for the user's group.");
      return null; // Or return [] if preferred
    }

    const iterationId = currentIteration.id;
    console.error(`Fetching stories for iteration ID: ${iterationId}`);

    // Fetch all stories for the found iteration
    const iterationStories = await shortcutFetch<ShortcutStory[]>(`/iterations/${iterationId}/stories`);
    return iterationStories.filter(story => story.owner_ids?.includes(currentUser.id));
  } catch (error) {
    console.error("Error getting stories in current iteration:", error);
    throw new Error("Failed to retrieve stories for the current iteration.");
  }
}

/**
 * Fetches all groups in the Shortcut workspace.
 */
async function listGroups(): Promise<ShortcutGroup[]> {
  // Note: The actual endpoint might have pagination, this is a simplified example.
  // Check docs/shortcut-rest-api.json for details.
  return shortcutFetch<ShortcutGroup[]>("/groups");
}

/**
 * Fetches the current user (full details) and their associated group details.
 */
async function getCurrentUserWithGroups(): Promise<{ user: ShortcutMember; groups: ShortcutGroup[] }> {
  // 1. Get basic info to find the user's ID
  const memberInfo = await getCurrentMemberInfo();
  const userId = memberInfo.id;

  // 2. Get full user details using the ID and list all groups concurrently
  const [user, allGroups] = await Promise.all([
    getMemberById(userId),
    listGroups()
  ]);

  // 3. Filter groups based on the user's group_ids
  // Ensure group_ids are available and are strings for comparison
  const userGroupIds = new Set(user.group_ids?.map(String) ?? []);
  const userGroups = allGroups.filter(group => userGroupIds.has(String(group.id)) && group.archived === false && !group.name.toLowerCase().includes("[do not use]"));

  return { user, groups: userGroups };
}


export {
    getCurrentUserWithGroups,
    getCurrentIterationStories
}; 