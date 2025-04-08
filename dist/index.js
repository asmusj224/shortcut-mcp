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
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const server_js_1 = require("./server.js");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.error("Starting Shortcut MCP Server via stdio...");
        // Connect the server to stdio transport
        const transport = new stdio_js_1.StdioServerTransport();
        yield server_js_1.server.connect(transport);
        console.error("Shortcut MCP Server connected and listening.");
    });
}
main().catch(error => {
    console.error("Failed to start Shortcut MCP Server:", error);
    process.exit(1);
});
