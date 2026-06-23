#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as api from "./api.js";
import { ApiToolRegistry, get_current_date_local } from "./tools.js";
import { encode } from '@toon-format/toon';
import { sanitize_api_response } from './sanitizer.js';
import { attachInitializeCapture } from './mcp_context.js';
import { SERVER_INSTRUCTIONS } from './instructions.js';

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
const __version__ = packageJson.version;

// Initialize MCP server with name, version, and capabilities
const server = new Server(
    {
        name: "Jellyfish API Server",
        version: __version__
    },
    {
        capabilities: {
            tools: {},      // Enable tools capability
            resources: {}   // Enable resources capability
        },
        instructions: SERVER_INSTRUCTIONS
    }
);

attachInitializeCapture(server, { transport: 'stdio' });

// Helper function to filter out undefined/null/empty array values from parameters
function filter_params(params) {
    const filtered = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0)) {
            filtered[key] = value;
        }
    }
    return filtered;
}

// Helper function to sanitize API response
async function sanitize_response(data) {
    // Check if it's an error response from api.js
    if (data.error) {
        return {
            approved: false,
            message: `Error: ${data.error}${data.message ? `\n${data.message}` : ''}`
        };
    }

    // Encode to TOON first, then sanitize what will actually be sent to LLM
    const toonData = encode(data);
    const sanitizeResult = await sanitize_api_response(toonData);

    if (sanitizeResult.approved) {
        return {
            approved: true,
            message: sanitizeResult.message,
            toonData: toonData
        };
    } else {
        return {
            approved: false,
            message: sanitizeResult.message
        };
    }
}

// Helper function to format sanitized response for MCP tools
function format_tool_response(sanitizeResult) {
    if (sanitizeResult.approved) {
        return {
            content: [{
                type: "text",
                text: `${sanitizeResult.message}\n\n${sanitizeResult.toonData}`
            }]
        };
    } else {
        return {
            content: [{
                type: "text",
                text: sanitizeResult.message
            }]
        };
    }
}

// Helper function to format sanitized response for MCP resources
function format_resource_response(uri, sanitizeResult) {
    if (sanitizeResult.approved) {
        return {
            contents: [{
                uri: uri,
                mimeType: "text/plain",
                text: sanitizeResult.toonData
            }]
        };
    } else {
        return {
            contents: [{
                uri: uri,
                mimeType: "text/plain",
                text: sanitizeResult.message
            }]
        };
    }
}

// Helper function to process tool response (combines sanitize + format)
async function process_tool_response(data) {
    const sanitizeResult = await sanitize_response(data);
    return format_tool_response(sanitizeResult);
}

// Helper function to process resource response (sanitize + format)
async function process_resource_response(uri, data) {
    const sanitizeResult = await sanitize_response(data);
    return format_resource_response(uri, sanitizeResult);
}


// Handler to list all available resources (returns API schema resource)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: "schema://api",
                mimeType: "application/json",
                name: "api_schema",
                description: "Get the complete API schema with all available endpoints"
            }
        ]
    };
});

// Handler to read specific resources when requested by URI
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri == "schema://api") {
        const data = await api.api_get_api_schema();
        return process_resource_response("schema://api", data);
    }
    throw new Error(`Unknown resource: ${request.params.uri}`);
});

// Handler to list all available tools (returns Jellyfish API tools)
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            ...ApiToolRegistry.listDefinitions(),
            {
                name: "get_current_date",
                description: "Returns today's date in the specified timezone (default UTC). Call this BEFORE computing any relative date like \"yesterday\", \"last week\", \"this quarter\", \"last Monday\". Today's date is not in your context — guessing it from training data leads to wrong-year errors that downstream tools (e.g. search_deliverables) will reject. After calling, use the returned `date` to compute ISO bounds for timeframe_start / timeframe_end. The `day_of_week` field helps with weekday-relative queries.",
                inputSchema: {
                    type: "object",
                    properties: {
                        timezone: { type: "string", description: "IANA timezone name, e.g. \"America/New_York\", \"Europe/London\", \"UTC\". Defaults to UTC if omitted." }
                    },
                    required: []
                }
            }
        ]
    };
});

// Handler to execute tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const params = filter_params(request.params.arguments || {});

    const tool = ApiToolRegistry.lookup(request.params.name);
    if (tool) {
        return process_tool_response(await tool.call(params));
    }

    switch (request.params.name) {
        case "get_current_date":
            return process_tool_response(get_current_date_local(params.timezone));

        default:
            throw new Error(`Unknown tool: ${request.params.name}`);
    }
});

// Main function to start the MCP server with stdio transport
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

// Start the server and handle any errors
main().catch(console.error);