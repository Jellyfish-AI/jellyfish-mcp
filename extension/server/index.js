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
import { encode } from '@toon-format/toon';
import { sanitize_api_response } from './sanitizer.js';

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
        }
    }
);

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
            // ALLOCATIONS
            {
                name: "allocations_by_person",
                description: "Returns allocation data for the whole company, aggregated by person.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        decimal_places: { type: "integer", description: "Show FTE amounts rounded to this many decimal places (1 to 3). Defaults to 1." },
                        include_below_threshold_card_keys: { type: "boolean", description: "Include allocated card keys that round to 0 FTE. Omit when using max_n_allocation_card_keys (default true works well). Set to false when omitting max_n_allocation_card_keys to limit excessive data volume from minor allocations." },
                        max_n_allocation_card_keys: { type: "integer", description: "CRITICAL: Limits card keys per entry to top N by allocation to prevent massive responses. Default (omitted) returns ALL card keys which is rarely advised. RECOMMENDED VALUES: 0=totals only (no card-level detail needed), 3-5=executive summary, 5-10=standard analysis, 10-20=detailed analysis." }
                    },
                    required: []
                }
            },
            {
                name: "allocations_by_team",
                description: "Returns allocation data for the whole company, aggregated by team at the specified hierarchy level.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        decimal_places: { type: "integer", description: "Show FTE amounts rounded to this many decimal places (1 to 3). Defaults to 1." },
                        include_below_threshold_card_keys: { type: "boolean", description: "Include allocated card keys that round to 0 FTE. Omit when using max_n_allocation_card_keys (default true works well). Set to false when omitting max_n_allocation_card_keys to limit excessive data volume from minor allocations." },
                        max_n_allocation_card_keys: { type: "integer", description: "CRITICAL: Limits card keys per entry to top N by allocation to prevent massive responses. Default (omitted) returns ALL card keys which is rarely advised. RECOMMENDED VALUES: 0=totals only (no card-level detail needed), 3-5=executive summary, 5-10=standard analysis, 10-20=detailed analysis." },
                        team_hierarchy_level: { type: "integer", description: "Returns allocation details for each unit at the hierarchy Org Level represented by this number. The highest Org Level in your Organization Structure is '1', the Org Level just beneath that is '2', and so on. E.g., For a Division > Group > Team hierarchy, Division is 1, Group is 2, Team is 3." },
                        include_person_breakout: { type: "boolean", description: "Include person details" }
                    },
                    required: ["team_hierarchy_level"]
                }
            },
            {
                name: "allocations_by_investment_category",
                description: "Returns allocation data for the whole company, aggregated by investment category.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        decimal_places: { type: "integer", description: "Show FTE amounts rounded to this many decimal places (1 to 3). Defaults to 1." },
                        include_below_threshold_card_keys: { type: "boolean", description: "Include allocated card keys that round to 0 FTE. Omit when using max_n_allocation_card_keys (default true works well). Set to false when omitting max_n_allocation_card_keys to limit excessive data volume from minor allocations." },
                        max_n_allocation_card_keys: { type: "integer", description: "CRITICAL: Limits card keys per entry to top N by allocation to prevent massive responses. Default (omitted) returns ALL card keys which is rarely advised. RECOMMENDED VALUES: 0=totals only (no card-level detail needed), 3-5=executive summary, 5-10=standard analysis, 10-20=detailed analysis." }
                    },
                    required: []
                }
            },
            {
                name: "allocations_by_investment_category_person",
                description: "Returns allocation data for the whole company, aggregated by investment category and person.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        decimal_places: { type: "integer", description: "Show FTE amounts rounded to this many decimal places (1 to 3). Defaults to 1." },
                        include_below_threshold_card_keys: { type: "boolean", description: "Include allocated card keys that round to 0 FTE. Omit when using max_n_allocation_card_keys (default true works well). Set to false when omitting max_n_allocation_card_keys to limit excessive data volume from minor allocations." },
                        max_n_allocation_card_keys: { type: "integer", description: "CRITICAL: Limits card keys per entry to top N by allocation to prevent massive responses. Default (omitted) returns ALL card keys which is rarely advised. RECOMMENDED VALUES: 0=totals only (no card-level detail needed), 3-5=executive summary, 5-10=standard analysis, 10-20=detailed analysis." }
                    },
                    required: []
                }
            },
            {
                name: "allocations_by_investment_category_team",
                description: "Returns allocation data for the whole company, aggregated by investment category and team at the specified hierarchy level.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        decimal_places: { type: "integer", description: "Show FTE amounts rounded to this many decimal places (1 to 3). Defaults to 1." },
                        include_below_threshold_card_keys: { type: "boolean", description: "Include allocated card keys that round to 0 FTE. Omit when using max_n_allocation_card_keys (default true works well). Set to false when omitting max_n_allocation_card_keys to limit excessive data volume from minor allocations." },
                        max_n_allocation_card_keys: { type: "integer", description: "CRITICAL: Limits card keys per entry to top N by allocation to prevent massive responses. Default (omitted) returns ALL card keys which is rarely advised. RECOMMENDED VALUES: 0=totals only (no card-level detail needed), 3-5=executive summary, 5-10=standard analysis, 10-20=detailed analysis." },
                        team_hierarchy_level: { type: "integer", description: "Returns allocation details for each unit at the hierarchy Org Level represented by this number. The highest Org Level in your Organization Structure is '1', the Org Level just beneath that is '2', and so on. E.g., For a Division > Group > Team hierarchy, Division is 1, Group is 2, Team is 3." },
                        include_person_breakout: { type: "boolean", description: "Include person details" }
                    },
                    required: ["team_hierarchy_level"]
                }
            },
            {
                name: "allocations_by_work_category",
                description: "Returns allocation data for the whole company, aggregated by deliverable within the specified work category.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        decimal_places: { type: "integer", description: "Show FTE amounts rounded to this many decimal places (1 to 3). Defaults to 1." },
                        include_below_threshold_card_keys: { type: "boolean", description: "Include allocated card keys that round to 0 FTE. Omit when using max_n_allocation_card_keys (default true works well). Set to false when omitting max_n_allocation_card_keys to limit excessive data volume from minor allocations." },
                        max_n_allocation_card_keys: { type: "integer", description: "CRITICAL: Limits card keys per entry to top N by allocation to prevent massive responses. Default (omitted) returns ALL card keys which is rarely advised. RECOMMENDED VALUES: 0=totals only (no card-level detail needed), 3-5=executive summary, 5-10=standard analysis, 10-20=detailed analysis." },
                        work_category_slug: { type: "string", description: "Work category slug" }
                    },
                    required: ["work_category_slug"]
                }
            },
            {
                name: "allocations_by_work_category_person",
                description: "Returns allocation data for the whole company, aggregated by deliverable within the specified work category and person.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        decimal_places: { type: "integer", description: "Show FTE amounts rounded to this many decimal places (1 to 3). Defaults to 1." },
                        include_below_threshold_card_keys: { type: "boolean", description: "Include allocated card keys that round to 0 FTE. Omit when using max_n_allocation_card_keys (default true works well). Set to false when omitting max_n_allocation_card_keys to limit excessive data volume from minor allocations." },
                        max_n_allocation_card_keys: { type: "integer", description: "CRITICAL: Limits card keys per entry to top N by allocation to prevent massive responses. Default (omitted) returns ALL card keys which is rarely advised. RECOMMENDED VALUES: 0=totals only (no card-level detail needed), 3-5=executive summary, 5-10=standard analysis, 10-20=detailed analysis." },
                        work_category_slug: { type: "string", description: "Work category slug" }
                    },
                    required: ["work_category_slug"]
                }
            },
            {
                name: "allocations_by_work_category_team",
                description: "Returns allocation data for the whole company, aggregated by deliverable within the specified work category and team at the specified hierarchy level.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        decimal_places: { type: "integer", description: "Show FTE amounts rounded to this many decimal places (1 to 3). Defaults to 1." },
                        include_below_threshold_card_keys: { type: "boolean", description: "Include allocated card keys that round to 0 FTE. Omit when using max_n_allocation_card_keys (default true works well). Set to false when omitting max_n_allocation_card_keys to limit excessive data volume from minor allocations." },
                        max_n_allocation_card_keys: { type: "integer", description: "CRITICAL: Limits card keys per entry to top N by allocation to prevent massive responses. Default (omitted) returns ALL card keys which is rarely advised. RECOMMENDED VALUES: 0=totals only (no card-level detail needed), 3-5=executive summary, 5-10=standard analysis, 10-20=detailed analysis." },
                        team_hierarchy_level: { type: "integer", description: "Returns allocation details for each unit at the hierarchy Org Level represented by this number. The highest Org Level in your Organization Structure is '1', the Org Level just beneath that is '2', and so on. E.g., For a Division > Group > Team hierarchy, Division is 1, Group is 2, Team is 3." },
                        work_category_slug: { type: "string", description: "Work category slug" },
                        include_person_breakout: { type: "boolean", description: "Include person details" }
                    },
                    required: ["team_hierarchy_level", "work_category_slug"]
                }
            },
            {
                name: "allocations_filter_fields",
                description: "Returns a list of the available fields and known values for filtering allocations.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "allocations_summary_by_investment_category",
                description: "Returns total FTE amounts for investment categories. This call supports filtering which people are included in the totals.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\", \"sprint\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        decimal_places: { type: "integer", description: "Show FTE amounts rounded to this many decimal places (1 to 3). Defaults to 1." },
                        include_below_threshold_card_keys: { type: "boolean", description: "Include allocated card keys that round to 0 FTE. Omit when using max_n_allocation_card_keys (default true works well). Set to false when omitting max_n_allocation_card_keys to limit excessive data volume from minor allocations." },
                        max_n_allocation_card_keys: { type: "integer", description: "CRITICAL: Limits card keys per entry to top N by allocation to prevent massive responses. Default (omitted) returns ALL card keys which is rarely advised. RECOMMENDED VALUES: 0=totals only (no card-level detail needed), 3-5=executive summary, 5-10=standard analysis, 10-20=detailed analysis." },
                        team_id: { type: "array", description: "List of team IDs. Returns total FTE amounts for only people in these team IDs, all of which must be at the same hierarchy org level. Can include 'null' for people with no team." },
                        role: { type: "array", description: "List of roles. Returns total FTE amounts for only people with these roles. Can include 'null' for people with no role. To check what roles are available, use the allocations_filter_fields tool." },
                        location: { type: "array", description: "List of locations. Returns total FTE amounts for only people with these locations. Can include 'null' for people with no location. To check what locations are available, use the allocations_filter_fields tool." },
                        custom_column_laptop: { type: "array", description: "List of laptop types. Returns total FTE amounts for only people with these custom field values. Can include 'null' for people with no value for this field. To check what values are available, use the allocations_filter_fields tool." }
                    },
                    required: []
                }
            },
            {
                name: "allocations_summary_by_work_category",
                description: "Returns total FTE amounts for deliverables within a work category. Supports filtering.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\", \"sprint\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        decimal_places: { type: "integer", description: "Show FTE amounts rounded to this many decimal places (1 to 3). Defaults to 1." },
                        include_below_threshold_card_keys: { type: "boolean", description: "Include allocated card keys that round to 0 FTE. Omit when using max_n_allocation_card_keys (default true works well). Set to false when omitting max_n_allocation_card_keys to limit excessive data volume from minor allocations." },
                        max_n_allocation_card_keys: { type: "integer", description: "CRITICAL: Limits card keys per entry to top N by allocation to prevent massive responses. Default (omitted) returns ALL card keys which is rarely advised. RECOMMENDED VALUES: 0=totals only (no card-level detail needed), 3-5=executive summary, 5-10=standard analysis, 10-20=detailed analysis." },
                        team_id: { type: "array", description: "List of team IDs. Returns total FTE amounts for only people in these team IDs, all of which must be at the same hierarchy org level. Can include 'null' for people with no team." },
                        role: { type: "array", description: "List of roles. Returns total FTE amounts for only people with these roles. Can include 'null' for people with no role. To check what roles are available, use the allocations_filter_fields tool." },
                        location: { type: "array", description: "List of locations. Returns total FTE amounts for only people with these locations. Can include 'null' for people with no location. To check what locations are available, use the allocations_filter_fields tool." },
                        work_category_slug: { type: "string", description: "Work category slug" },
                        custom_column_laptop: { type: "array", description: "List of laptop types. Returns total FTE amounts for only people with these custom field values. Can include 'null' for people with no value for this field. To check what values are available, use the allocations_filter_fields tool." }
                    },
                    required: ["work_category_slug"]
                }
            },
            // DELIVERY
            {
                name: "deliverable_details",
                description: "Returns data about a specific deliverable.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        deliverable_id: { type: "integer", description: "Jellyfish deliverable id" }
                    },
                    required: ["deliverable_id"]
                }
            },
            {
                name: "deliverable_scope_and_effort_history",
                description: "Returns weekly data about the scope of a deliverable and the total effort allocated per week.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        deliverable_id: { type: "integer", description: "Jellyfish deliverable id" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" }
                    },
                    required: ["deliverable_id"]
                }
            },
            {
                name: "work_categories",
                description: "Returns a list of all known work categories.",
                inputSchema: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "work_category_contents",
                description: "Returns data about the deliverables in a specified work category.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        work_category_slug: { type: "string", description: "Work category slug" },
                        completed_only: { type: "boolean", description: "Only completed deliverables" },
                        inprogress_only: { type: "boolean", description: "Only in-progress deliverables" },
                        view_archived: { type: "boolean", description: "Include archived deliverables" },
                        team_id: { type: "array", description: "List of team IDs" }
                    },
                    required: ["work_category_slug"]
                }
            },
            // DEVEX
            {
                name: "devex_insights_by_team",
                description: "Returns DevEx insights data.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        id: { type: "integer", description: "Jellyfish team id" },
                        devex_team_ref: { type: "string", description: "Unique identifier for a team in DevEx" },
                        team_id: { type: "integer", description: "Jellyfish team id" },
                        series_id: { type: "string", description: "Unique identifier for a series in DevEx" },
                        survey_id: { type: "string", description: "Unique identifier for a survey in DevEx" }
                    },
                    required: []
                }
            },
            // METRICS
            {
                name: "company_metrics",
                description: "Returns metrics data for the company during the specified timeframe.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" }
                    },
                    required: []
                }
            },
            {
                name: "person_metrics",
                description: "Returns metrics data for the specified person during the specified timeframe.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        person_id: { type: "array", description: "List of person IDs" }
                    },
                    required: ["person_id"]
                }
            },
            {
                name: "team_metrics",
                description: "Returns metrics data for the specified team during the specified timeframe.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\", \"sprint\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        team_id: { type: "array", description: "List of team IDs" }
                    },
                    required: ["team_id"]
                }
            },
            {
                name: "team_sprint_summary",
                description: "Returns issue count and, if available, story point data for a team's sprints in the specified timeframe.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        team_id: { type: "integer", description: "Team ID" }
                    },
                    required: ["team_id"]
                }
            },
            {
                name: "unlinked_pull_requests",
                description: "Lists details of unlinked pull requests merged during the specified timeframe.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                        end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                        unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                        series: { type: "boolean", description: "Whether to return series data" },
                        instance_slug: { type: "array", description: "List of git instance slugs" },
                        organization_name: { type: "array", description: "List of organization names" },
                        repo_name: { type: "array", description: "List of repository names" }
                    },
                    required: []
                }
            },
            // PEOPLE
            {
                name: "list_engineers",
                description: "Returns a list of all active allocatable people as of a specific date.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        effective_date: { type: "string", description: "Effective date (YYYY-MM-DD)" }
                    },
                    required: []
                }
            },
            {
                name: "search_people",
                description: "Searches for people by name, email, or id.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        name: { type: "array", description: "List of names" },
                        email: { type: "array", description: "List of emails" },
                        person_id: { type: "array", description: "List of person IDs" }
                    },
                    required: []
                }
            },
            // TEAMS
            {
                name: "list_teams",
                description: "Displays all teams at the specified hierarchy level. Optionally, includes child teams.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        hierarchy_level: { type: "integer", description: "Team hierarchy level" },
                        include_children: { type: "boolean", description: "Whether to include child teams" }
                    },
                    required: ["hierarchy_level"]
                }
            },
            {
                name: "search_teams",
                description: "Searches for teams by name or id. It does not include child or parent information. It returns id, name, active, hierarchy_level, and hierarchy_level_name. Note: While name and team_id are both optional, at least one must be provided.",
                inputSchema: {
                    type: "object",
                    properties: {
                        format: { type: "string", default: "json", description: "Response format" },
                        name: { type: "array", description: "List of team names" },
                        team_id: { type: "array", description: "List of team IDs" }
                    },
                    required: []
                }
            }
        ]
    };
});

// Handler to execute tool calls (processes requests for all 24 Jellyfish API tools)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const params = filter_params(request.params.arguments || {});

    switch (request.params.name) {
        // ALLOCATIONS
        case "allocations_by_person":
            return process_tool_response(await api.api_allocations_by_person(params));
        case "allocations_by_team":
            return process_tool_response(await api.api_allocations_by_team(params));
        case "allocations_by_investment_category":
            return process_tool_response(await api.api_allocations_by_investment_category(params));
        case "allocations_by_investment_category_person":
            return process_tool_response(await api.api_allocations_by_investment_category_person(params));
        case "allocations_by_investment_category_team":
            return process_tool_response(await api.api_allocations_by_investment_category_team(params));
        case "allocations_by_work_category":
            return process_tool_response(await api.api_allocations_by_work_category(params));
        case "allocations_by_work_category_person":
            return process_tool_response(await api.api_allocations_by_work_category_person(params));
        case "allocations_by_work_category_team":
            return process_tool_response(await api.api_allocations_by_work_category_team(params));
        case "allocations_filter_fields":
            return process_tool_response(await api.api_allocations_filter_fields({ format: "json" }));
        case "allocations_summary_by_investment_category":
            return process_tool_response(await api.api_allocations_summary_by_investment_category(params));
        case "allocations_summary_by_work_category":
            return process_tool_response(await api.api_allocations_summary_by_work_category(params));

        // DELIVERY
        case "deliverable_details":
            return process_tool_response(await api.api_deliverable_details(params));
        case "deliverable_scope_and_effort_history":
            return process_tool_response(await api.api_deliverable_scope_and_effort_history(params));
        case "work_categories":
            return process_tool_response(await api.api_work_categories({ format: "json" }));
        case "work_category_contents":
            return process_tool_response(await api.api_work_category_contents(params));

        // DEVEX
        case "devex_insights_by_team":
            return process_tool_response(await api.api_devex_insights_by_team(params));

        // METRICS
        case "company_metrics":
            return process_tool_response(await api.api_company_metrics(params));
        case "person_metrics":
            return process_tool_response(await api.api_person_metrics(params));
        case "team_metrics":
            return process_tool_response(await api.api_team_metrics(params));
        case "team_sprint_summary":
            return process_tool_response(await api.api_team_sprint_summary(params));
        case "unlinked_pull_requests":
            return process_tool_response(await api.api_unlinked_pull_requests(params));

        // PEOPLE
        case "list_engineers":
            return process_tool_response(await api.api_list_engineers(params));
        case "search_people":
            return process_tool_response(await api.api_search_people(params));

        // TEAMS
        case "list_teams":
            return process_tool_response(await api.api_list_teams(params));
        case "search_teams":
            return process_tool_response(await api.api_search_teams(params));
        
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