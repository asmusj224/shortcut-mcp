import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { 
  getCurrentUserWithGroups,
  getCurrentIterationStories,
} from "./shortcut/client.js";
import type { ShortcutStory } from "./shortcut/types.js";

// Create an MCP server instance
const server = new McpServer({
  name: "Shortcut MCP Server",
  version: "0.1.0",
  // Define capabilities based on requirements.md
  capabilities: {
    resources: {},
    tools: {},
    // prompts: {}, // Add if prompts are needed later
  }
});

// --- Resources --- 

/**
 * Resource to get information about the currently authenticated user and their groups.
 */
server.resource(
  "currentUser", 
  "shortcut://user/me", 
  async (uri): Promise<{ contents: { uri: string; text: string }[] }> => {
    try {
      // Fetch user and their groups together
      const { user, groups } = await getCurrentUserWithGroups();

      // Combine user and group data
      const responseData = {
        user: {id: user.id, name: user.profile.name, email: user.profile.email_address},
        groups: groups.map(group => ({id: group.id, name: group.name}))
      };

      // Format the combined data as a JSON string for the resource content
      const responseJson = JSON.stringify(responseData, null, 2); 
      return {
        contents: [{
          uri: uri.href, // Use the requested URI in the response
          text: responseJson
        }]
      };
    } catch (error: unknown) {
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
  }
);



server.tool(
  "createStory",
  {
    name: z.string().describe("The name of the story"),
    description: z.string().optional().describe("The description of the story"),
  },
  async (args) => {
    return {
      content: [
        {
          type: "text",
          text: `Creating story ${args.name}`
        },
      ],
    };
  }
);

server.tool(
  "getStoriesForCurrentIteration",
  {},
  async () => {
    try {
      const stories = await getCurrentIterationStories();

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
      const formattedStories = stories.map((story: ShortcutStory) => ({ 
        name: story.name,
        app_url: story.app_url
      }));
      const responseJson = JSON.stringify(formattedStories, null, 2);

      return {
        content: [{
          type:"text",
          text:  JSON.stringify(formattedStories, null, 2)
        }]
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching current iteration stories';
      return {
        content: [{
          type: "text",
          text: `Error: Failed to fetch current iteration stories - ${errorMessage}`
        }]
      };
    }
  }
);


export { server }; 