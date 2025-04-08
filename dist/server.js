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
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const zod_1 = require("zod");
const client_js_1 = require("./shortcut/client.js");
// Create an MCP server instance
const server = new mcp_js_1.McpServer({
    name: "Shortcut MCP Server",
    version: "0.1.0",
    // Define capabilities based on requirements.md
    capabilities: {
        resources: {},
        tools: {},
        // prompts: {}, // Add if prompts are needed later
    }
});
exports.server = server;
// --- Resources --- 
/**
 * Resource to get information about the currently authenticated user and their groups.
 */
server.resource("currentUser", "shortcut://user/me", (uri) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch user and their groups together
        const { user, groups } = yield (0, client_js_1.getCurrentUserWithGroups)();
        // Combine user and group data
        const responseData = {
            user: { id: user.id, name: user.profile.name, email: user.profile.email_address },
            groups: groups.map(group => ({ id: group.id, name: group.name }))
        };
        // Format the combined data as a JSON string for the resource content
        const responseJson = JSON.stringify(responseData, null, 2);
        return {
            contents: [{
                    uri: uri.href, // Use the requested URI in the response
                    text: responseJson
                }]
        };
    }
    catch (error) {
        console.error(`Error fetching resource ${uri.href}:`, error);
        // Return an error message within the resource content
        const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching user or groups';
        return {
            contents: [{
                    uri: uri.href,
                    text: `Error: Failed to fetch current user/groups - ${errorMessage}`
                }]
        };
    }
}));
server.tool("createStory", {
    name: zod_1.z.string().describe("The name of the story"),
    description: zod_1.z.string().optional().describe("The description of the story"),
}, (args) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        content: [
            {
                type: "text",
                text: `Creating story ${args.name}`
            },
        ],
    };
}));
server.tool("getStoriesForCurrentIteration", {}, () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stories = yield (0, client_js_1.getCurrentIterationStories)();
        if (!stories) {
            // Handle case where there's no active iteration or an error occurred upstream
            return {
                content: [{
                        type: "text",
                        text: "No active iteration found or failed to retrieve stories."
                    }]
            };
        }
        if (stories.length === 0) {
            return {
                content: [{
                        type: "text",
                        text: "No stories found in the active iteration."
                    }]
            };
        }
        // Format stories to include only name and app_url
        const formattedStories = stories.map((story) => ({
            name: story.name,
            app_url: story.app_url
        }));
        const responseJson = JSON.stringify(formattedStories, null, 2);
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify(formattedStories, null, 2)
                }]
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching current iteration stories';
        return {
            content: [{
                    type: "text",
                    text: `Error: Failed to fetch current iteration stories - ${errorMessage}`
                }]
        };
    }
}));
