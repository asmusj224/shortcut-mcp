import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./server.js";

async function main() {
  console.error("Starting Shortcut MCP Server via stdio...");
  
  // Connect the server to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Shortcut MCP Server connected and listening.");
}

main().catch(error => {
  console.error("Failed to start Shortcut MCP Server:", error);
  process.exit(1);
});
