# Shortcut MCP

The goal of this project is to build an example MCP Stdio Server that will integrate with Cursor to allow you to request your Shortcut tickets, create new tickets with provided context, and move tickets to different workflows without leaving your environment.

### Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Create a Shortcut Token at `https://app.shortcut.com/settings/`

3. Build MCP server:
   ```
   npm run build
   ```

4. Setup MCP in Cursor:
   - Go to Cursor settings → MCP
   - Add the following to your mcp.json:
   ```json
   "Shortcut": {
     "command": "node",
     "args": ["~/PATH_TO_PROJECT/shortcut-mcp/dist/index.js"],
     "env": {
       "SHORTCUT_API_TOKEN": "TOKEN_GOES_HERE"
     }
   }
   ```

5. Ensure the MCP server is enabled.

6. Use Agent mode to interact with the MCP server.

### Example Usage

```
Please get my current stories
```