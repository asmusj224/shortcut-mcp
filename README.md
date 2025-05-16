# Shortcut MCP Server

An MCP (Model Context Protocol) server that provides access to Shortcut (project management tool) resources, tools, and prompts for LLM assistants.

## Features

This MCP server provides the following functionality:

### Resources

- **Current User Information**: Get information about the currently authenticated user and their groups
- **Workflows**: Get all available workflows and their states
- **Current Iteration Stories**: Get stories assigned to you in the current active iteration

### Tools

- **Get Stories for Current Iteration**: List all stories in your current active iteration
- **Create Story**: Create a new story in Shortcut
- **Move Story to State**: Move a story to a different workflow state

### Prompts

Includes best practice templates for creating different types of stories:

- **Create Feature Story**: Template for creating well-structured feature stories
- **Create Bug Story**: Template for creating detailed bug reports
- **Create Chore Story**: Template for creating technical maintenance tasks

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the project root with your Shortcut API token:
   ```
   SHORTCUT_API_TOKEN=your_api_token_here
   ```
   Get your token from [Shortcut API Tokens page](https://app.shortcut.com/settings/api-tokens)

4. Build the project:
   ```
   npm run build
   ```

5. Run the server:
   ```
   npm start
   ```

## Usage with LLM Assistants

Once your MCP server is running, you can connect to it with any MCP-compatible LLM client.

### Example Usage

```
# Get your current iteration stories
Get stories from my current iteration

# Create a new feature story
Create a story called "Implement user profile page" with description "Add a new user profile page with bio and avatar"

# Move a story to a different state
Move the "Implement user profile page" story to "In Development" state

# Use a template for creating a bug report
Help me create a bug report for the login page not working on mobile devices
```

## Development

- Build the project: `npm run build`
- Run in development mode: `npm run dev`
- Start the server: `npm start`
