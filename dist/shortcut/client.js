"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUserWithGroups = getCurrentUserWithGroups;
exports.getCurrentIterationStories = getCurrentIterationStories;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables from .env file
const SHORTCUT_API_TOKEN = process.env.SHORTCUT_API_TOKEN;
const SHORTCUT_API_URL = 'https://api.app.shortcut.com/api/v3';
if (!SHORTCUT_API_TOKEN) {
    console.error('Error: SHORTCUT_API_TOKEN environment variable is not set.');
    console.error('Please create an API token at https://app.shortcut.com/settings/api-tokens and set it as SHORTCUT_API_TOKEN.');
    process.exit(1); // Exit if the token is missing
}
// Assert that the token is a string after the check
const apiToken = SHORTCUT_API_TOKEN;
// Basic fetch function with authorization header
function shortcutFetch(endpoint_1) {
    return __awaiter(this, arguments, void 0, function* (endpoint, options = {}) {
        const url = `${SHORTCUT_API_URL}${endpoint}`;
        console.error(`Fetching ${url}`);
        const headers = Object.assign({ 'Content-Type': 'application/json', 'Shortcut-Token': apiToken }, (options.headers || {}));
        const response = yield fetch(url, Object.assign(Object.assign({}, options), { headers }));
        if (!response.ok) {
            const errorBody = yield response.text();
            throw new Error(`Shortcut API Error (${response.status}): ${errorBody}`);
        }
        // Handle cases where there might be no content (e.g., 204 No Content)
        if (response.status === 204) {
            // For 204, we technically shouldn't parse JSON.
            // Return null or an appropriate empty value depending on expected T.
            // Casting to T might be unsafe if T isn't expecting null/undefined.
            // Consider refining this based on how 204 is used in the API.
            return null;
        }
        const data = yield response.json();
        return data; // Return the parsed JSON data, cast to type T
    });
}
// --- Shortcut API Functions ---
/**
 * Fetches basic information about the current user (API token owner).
 * @returns {Promise<ShortcutMemberInfo>} A promise that resolves to the basic member info object.
 */
function getCurrentMemberInfo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Use the correct endpoint and type
            return yield shortcutFetch('/member');
        }
        catch (error) {
            console.error("Error fetching current member info:", error);
            throw error; // Re-throw the error to be handled by the caller
        }
    });
}
/**
 * Fetches detailed information for a specific member by their ID.
 * @param {string} memberId - The UUID of the member.
 * @returns {Promise<ShortcutMember>} A promise that resolves to the full member object.
 */
function getMemberById(memberId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield shortcutFetch(`/members/${memberId}`);
        }
        catch (error) {
            console.error(`Error fetching member with ID ${memberId}:`, error);
            throw error;
        }
    });
}
/**
 * Finds the first active ("started") iteration.
 * @returns {Promise<ShortcutIteration | null>} The first started iteration found, or null.
 */
function findCurrentIteration(groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const iterations = yield shortcutFetch('/iterations');
            const startedIteration = iterations.find(iter => { var _a; return iter.status === 'started' && ((_a = iter.group_ids) === null || _a === void 0 ? void 0 : _a.includes(groupId)); });
            console.error(`Found ${iterations.length} iterations, first started iteration: ${startedIteration === null || startedIteration === void 0 ? void 0 : startedIteration.name}. ${startedIteration === null || startedIteration === void 0 ? void 0 : startedIteration.id}`);
            return startedIteration || null;
        }
        catch (error) {
            console.error("Error fetching iterations:", error);
            throw error;
        }
    });
}
/**
 * Gets all stories within the currently active iteration for the user's primary group.
 * @returns {Promise<ShortcutStory[] | null>} Stories if found, null if no active iteration exists.
 */
function getCurrentIterationStories() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Need the user's group to find the right iteration
            const currentUser = yield getCurrentMemberInfo();
            console.error("Current user:", currentUser);
            const user = yield getMemberById(currentUser.id);
            // Assuming the first group ID is the primary one for iterations
            const [groupId] = (_a = user.group_ids) !== null && _a !== void 0 ? _a : [];
            if (!groupId) {
                console.log("User does not belong to any group.");
                return null;
            }
            const currentIteration = yield findCurrentIteration(groupId);
            if (!currentIteration) {
                console.log("No active iteration found for the user's group.");
                return null; // Or return [] if preferred
            }
            const iterationId = currentIteration.id;
            console.error(`Fetching stories for iteration ID: ${iterationId}`);
            // Fetch all stories for the found iteration
            const iterationStories = yield shortcutFetch(`/iterations/${iterationId}/stories`);
            return iterationStories.filter(story => { var _a; return (_a = story.owner_ids) === null || _a === void 0 ? void 0 : _a.includes(currentUser.id); });
        }
        catch (error) {
            console.error("Error getting stories in current iteration:", error);
            throw new Error("Failed to retrieve stories for the current iteration.");
        }
    });
}
/**
 * Fetches all groups in the Shortcut workspace.
 */
function listGroups() {
    return __awaiter(this, void 0, void 0, function* () {
        // Note: The actual endpoint might have pagination, this is a simplified example.
        // Check docs/shortcut-rest-api.json for details.
        return shortcutFetch("/groups");
    });
}
/**
 * Fetches the current user (full details) and their associated group details.
 */
function getCurrentUserWithGroups() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        // 1. Get basic info to find the user's ID
        const memberInfo = yield getCurrentMemberInfo();
        const userId = memberInfo.id;
        // 2. Get full user details using the ID and list all groups concurrently
        const [user, allGroups] = yield Promise.all([
            getMemberById(userId),
            listGroups()
        ]);
        // 3. Filter groups based on the user's group_ids
        // Ensure group_ids are available and are strings for comparison
        const userGroupIds = new Set((_b = (_a = user.group_ids) === null || _a === void 0 ? void 0 : _a.map(String)) !== null && _b !== void 0 ? _b : []);
        const userGroups = allGroups.filter(group => userGroupIds.has(String(group.id)) && group.archived === false && !group.name.toLowerCase().includes("[do not use]"));
        return { user, groups: userGroups };
    });
}
