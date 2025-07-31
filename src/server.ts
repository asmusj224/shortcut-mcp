import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { 
  getCurrentUserWithGroups,
  getCurrentIterationStories,
  getEngineeringWorkflows,
  updateStoryWorkflowState,
  createStory,
  getAllWorkflows,
  getStoryById
} from "./shortcut/client.js";
import type { ShortcutStory } from "./shortcut/types.js";

const server = new McpServer({
  name: "Shortcut MCP Server",
  version: "0.1.0",
  capabilities: {
    resources: {
      "currentUser": {
        description: "Get information about the currently authenticated user, including their groups",
        example: {
          user: { id: 12345, name: "John Doe", email: "john@example.com" },
          groups: [{ id: 100, name: "Engineering" }]
        }
      },
      "workflows": {
        description: "Get all workflows and their states in the Shortcut organization",
        example: [{ id: 500, name: "Engineering", states: [{ id: 1000, name: "Ready for Dev", color: "#123456" }] }]
      },
      "iterationStories": {
        description: "Stories assigned to the current user in the active iteration",
        example: [{ id: 123, name: "Implement feature X", workflow_state_id: 456, story_type: "feature", app_url: "https://app.shortcut.com/org/story/123" }]
      }
    },
    tools: {
      "createStory": {
        description: "Create a new story in Shortcut",
        example: { name: "Implement login page", description: "Create a login page with email and password fields", storyType: "feature" }
      },
      "moveStoryToState": {
        description: "Move a story to a different workflow state",
        example: { storyName: "Implement login page", stateName: "In Progress" }
      },
      "getStoriesForCurrentIteration": {
        description: "Get all stories in the current iteration",
        example: {}
      },
      "getStoriesForUser": {
        description: "Get all stories assigned to a user",
        example: { userId: 123, storyName: "Implement login page" }
      },
      "getStoryById": {
        description: "Get a story by its ID",
        example: { storyId: 123 }
      }
    },
    prompts: {
      "createFeatureStory": {
        description: "Generate a properly formatted feature story with acceptance criteria",
        example: { title: "User Authentication", acceptanceCriteria: "Users can log in with email and password" }
      },
      "createBugStory": {
        description: "Generate a properly formatted bug report",
        example: { title: "Login button not working", stepsToReproduce: "1. Navigate to login page\n2. Enter credentials\n3. Click login", expectedBehavior: "User logs in", actualBehavior: "Nothing happens" }
      },
      "createChoreStory": {
        description: "Generate a properly formatted chore/task",
        example: { title: "Update dependencies", reason: "Security vulnerabilities in current packages" }
      }
    }
  }
});


server.resource(
  "currentUser", 
  "shortcut://user/me", 
  async (uri): Promise<{ contents: { uri: string; text: string }[] }> => {
    try {
      const { user, groups } = await getCurrentUserWithGroups();

      if (!user) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ error: "User not found or not authenticated" }, null, 2)
          }]
        };
      }

      const responseData = {
        user: {
          id: user.id, 
          name: user.profile.name, 
          email: user.profile.email_address
        },
        groups: groups.map(group => ({
          id: group.id, 
          name: group.name
        }))
      };

      const responseJson = JSON.stringify(responseData, null, 2); 
      return {
        contents: [{
          uri: uri.href,
          text: responseJson
        }]
      };
    } catch (error: unknown) {
      console.error(`Error fetching resource ${uri.href}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching user or groups';
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ error: `Failed to fetch current user/groups - ${errorMessage}` }, null, 2)
        }]
      };
    }
  }
);


server.resource(
  "workflows", 
  "shortcut://workflows", 
  async (uri): Promise<{ contents: { uri: string; text: string }[] }> => {
    try {
      const workflows = await getAllWorkflows();
      
      if (!workflows || workflows.length === 0) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ message: "No workflows found" }, null, 2)
          }]
        };
      }
      
      const formattedWorkflows = workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        states: workflow.states.map(state => ({
          id: state.id,
          name: state.name,
          color: state.color
        }))
      }));
      
      const responseJson = JSON.stringify(formattedWorkflows, null, 2);
      
      return {
        contents: [{
          uri: uri.href,
          text: responseJson
        }]
      };
    } catch (error: unknown) {
      console.error(`Error fetching workflows:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ error: `Failed to fetch workflows - ${errorMessage}` }, null, 2)
        }]
      };
    }
  }
);


server.resource(
  "iterationStories",
  "shortcut://iteration/current/stories",
  async (uri: URL): Promise<{ contents: { uri: string; text: string }[] }> => {
    try {
      const stories = await getCurrentIterationStories();
      
      if (!stories || stories.length === 0) {
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ message: "No stories found in current iteration" }, null, 2)
          }]
        };
      }
      
      const formattedStories = stories.map(story => ({
        id: story.id,
        name: story.name,
        story_type: story.story_type,
        workflow_state_id: story.workflow_state_id,
        app_url: story.app_url
      }));
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(formattedStories, null, 2)
        }]
      };
    } catch (error: unknown) {
      console.error(`Error fetching iteration stories:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({ error: `Failed to fetch iteration stories - ${errorMessage}` }, null, 2)
        }]
      };
    }
  }
);


server.tool(
  "createStory",
  {
    name: z.string().min(1).describe("The name of the story"),
    description: z.string().optional().describe("The description of the story"),
    storyType: z.enum(['feature', 'bug', 'chore']).default('feature').describe("The type of story (feature, bug, chore)"),
    workflowStateName: z.string().optional().describe("Name of the workflow state to assign (e.g., 'Ready for Dev', 'Unstarted')")
  },
  async (args) => {
    try {
      if (!args.name || args.name.trim() === '') {
        return {
          content: [{
            type: "text",
            text: "Error: Story name is required"
          }],
          isError: true
        };
      }

      let workflowStateId: number | undefined = undefined;
      
      if (args.workflowStateName && args.workflowStateName.length > 0) {
        const workflow = await getEngineeringWorkflows();
        
        if (!workflow || !workflow.states) {
          return {
            content: [{
              type: "text",
              text: "Error: Could not retrieve workflow states"
            }],
            isError: true
          };
        }
        
        const state = workflow.states.find(s => 
          s.name.toLowerCase().includes(args.workflowStateName!.toLowerCase())
        );
        
        if (state) {
          workflowStateId = state.id;
        } else {
          return {
            content: [{
              type: "text",
              text: `Warning: Could not find a workflow state matching "${args.workflowStateName}". Using default workflow state.`
            }]
          };
        }
      }
      
      const storyType = args.storyType || 'feature';
      
      const newStory = await createStory({
        name: args.name,
        description: args.description,
        story_type: storyType,
        workflow_state_id: workflowStateId
      });
      
      return {
        content: [{
          type: "text",
          text: `Successfully created story "${newStory.name}" with ID ${newStory.id}.\nView it at: ${newStory.app_url}`
        }]
      };
    } catch (error: unknown) {
      console.error("Error creating story:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: "text",
          text: `Error creating story: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);


server.tool(
  "moveStoryToState",
  {
    storyName: z.string().min(1).describe("The name of the story to move"),
    stateName: z.string().min(1).describe("The name of the workflow state to move the story to")
  },
  async (args) => {
    try {
      if (!args.storyName || args.storyName.trim() === '') {
        return {
          content: [{
            type: "text",
            text: "Error: Story name is required"
          }],
          isError: true
        };
      }
      
      if (!args.stateName || args.stateName.trim() === '') {
        return {
          content: [{
            type: "text",
            text: "Error: State name is required"
          }],
          isError: true
        };
      }
      
      const stories = await getCurrentIterationStories();
      
      if (!stories || stories.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No stories found in the current iteration"
          }],
          isError: true
        };
      }
      
      const workflow = await getEngineeringWorkflows();
      
      if (!workflow || !workflow.states) {
        return {
          content: [{
            type: "text",
            text: "Error: Could not retrieve workflow states"
          }],
          isError: true
        };
      }
      
      const story = stories.find(s => 
        s.name.toLowerCase().includes(args.storyName.toLowerCase())
      );
      
      if (!story) {
        return {
          content: [{
            type: "text",
            text: `Could not find a story matching "${args.storyName}"`
          }],
          isError: true
        };
      }
      
      const state = workflow.states.find(s => 
        s.name.toLowerCase().includes(args.stateName.toLowerCase())
      );
      
      if (!state) {
        return {
          content: [{
            type: "text",
            text: `Could not find a workflow state matching "${args.stateName}"`
          }],
          isError: true
        };
      }
      
      const updatedStory = await updateStoryWorkflowState(story.id, state.id);
      
      return {
        content: [{
          type: "text",
          text: `Successfully moved story "${updatedStory.name}" to "${state.name}"`
        }]
      };
    } catch (error: unknown) {
      console.error("Error moving story:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: "text",
          text: `Error: ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);


server.tool(
  "getStoriesForCurrentIteration",
  {},
  async () => {
    try {
      const stories = await getCurrentIterationStories();
      const workflow = await getEngineeringWorkflows();

      if (!stories) {
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

      if (!workflow || !workflow.states) {
        return {
          content: [{
            type: "text",
            text: "Warning: Could not retrieve workflow states. Story state names will not be included."
          }]
        };
      }

      const formattedStories = stories.map((story: ShortcutStory) => ({ 
        id: story.id,
        name: story.name,
        app_url: story.app_url,
        story_type: story.story_type,
        workflow_state_id: story.workflow_state_id,
        workflow_state_name: workflow.states.find(s => s.id === story.workflow_state_id)?.name || "Unknown"
      }));
      
      return {
        content: [{
          type:"text",
          text: JSON.stringify(formattedStories, null, 2)
        }]
      };
    } catch (error: unknown) {
      console.error("Error fetching current iteration stories:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching current iteration stories';
      return {
        content: [{
          type: "text",
          text: `Error: Failed to fetch current iteration stories - ${errorMessage}`
        }],
        isError: true
      };
    }
  }
);

server.tool(
  "getStoryById",
  {
    storyId: z.number().describe("The ID of the story to get")
  },
  async (args) => {
    try {
      const stories = await getStoryById(args.storyId);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(stories, null, 2)
        }]
      };
    } catch (error: unknown) {
      console.error("Error fetching story by ID:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching story by ID';
      return {
        content: [{
          type: "text",
          text: `Error: Failed to fetch story by ID - ${errorMessage}`
        }],
        isError: true
      };
    }
  }
)

server.prompt(
  "createFeatureStory",
  {
    title: z.string().min(1).describe("A brief, specific title describing the feature"),
    acceptanceCriteria: z.string().min(1).describe("Clear, testable acceptance criteria for the feature")
  },
  (args) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `I need to create a new feature story in Shortcut with the following details:
        
Title: ${args.title}

Description template:
## Background and Context
[Provide context and background information here]

## Feature Description
[Describe the feature here]

## Acceptance Criteria
${args.acceptanceCriteria}

## Implementation Notes
- Consider performance implications
- Ensure proper error handling
- Include unit tests
- Document any API changes

Can you help me create this story with the appropriate structure and ensuring it follows best practices?`
      }
    }]
  })
);

server.prompt(
  "createBugStory",
  {
    title: z.string().min(1).describe("A brief, specific title describing the bug"),
    stepsToReproduce: z.string().min(1).describe("Step-by-step instructions to reproduce the bug"),
    expectedBehavior: z.string().min(1).describe("What should happen when steps are followed correctly"),
    actualBehavior: z.string().min(1).describe("What actually happens when the bug occurs")
  },
  (args) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `I need to create a new bug story in Shortcut with the following details:
        
Title: ${args.title}

Description template:
## Bug Description
[Brief summary of the bug]

## Steps to Reproduce
${args.stepsToReproduce}

## Expected Behavior
${args.expectedBehavior}

## Actual Behavior
${args.actualBehavior}

## Environment
- Browser/Device: [specify]
- OS: [specify]
- Version: [specify]

## Additional Context
[Screenshots, logs, or other relevant information]

Can you help me create this bug report with the appropriate structure and ensuring it follows best practices?`
      }
    }]
  })
);

server.prompt(
  "createChoreStory",
  {
    title: z.string().min(1).describe("A brief, specific title describing the chore"),
    reason: z.string().min(1).describe("Why this chore is necessary")
  },
  (args) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `I need to create a new chore story in Shortcut with the following details:
        
Title: ${args.title}

Description template:
## Chore Description
[Brief summary of the technical task]

## Reason
${args.reason}

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Definition of Done
- [ ] Code implements all requirements
- [ ] Tests added/updated
- [ ] Documentation updated if needed
- [ ] PR reviewed and approved

Can you help me create this chore story with the appropriate structure and ensuring it follows best practices?`
      }
    }]
  })
);

export { server }; 