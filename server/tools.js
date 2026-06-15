import { api_generic } from './api.js';


class ApiTool {
    /**
     * Represents a single MCP tool backed by a Jellyfish API endpoint.
     *
     * Usage:
     *   new ApiTool({ name, description, inputSchema, endpoint })
     *
     * For tools with dynamic endpoints (e.g. path params), override `call`:
     *   new ApiTool({ name, description, inputSchema, call(params) { ... } })
    */
    constructor({ name, description, inputSchema, endpoint, call }) {
        this.name = name;
        this.description = description;
        this.inputSchema = inputSchema;
        this._endpoint = endpoint;
        if (call) this.call = call;
    }

    /**
     * Returns the { name, description, inputSchema } shape expected
     * by the MCP ListToolsRequestSchema.
     */
    toToolDefinition() {
        return {
            name: this.name,
            description: this.description,
            inputSchema: this.inputSchema,
        };
    }

    /**
     * Executes the tool by calling the Jellyfish API.
     * Override by passing a `call` function in the constructor
     * when the endpoint URL requires dynamic path parameters.
     */
    async call(params) {
        return api_generic(this._endpoint, params);
    }
}

const apiTools = [
    new ApiTool({
        name: "ai_company_adoption_analytics",
        description: "Returns per-tool AI adoption analytics aggregated across the entire company, including cohort counts and average usage percentage.",
        inputSchema: {
            type: "object",
            properties: {
                format: { type: "string", default: "json", description: "Response format" },
                start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" }
            },
            required: []
        },
        endpoint: "/endpoints/export/v0/ai_impact/company_adoption_analytics"
    }),

    new ApiTool({
        name: "ai_company_impact_analytics",
        description: "Returns per-tool AI impact analytics aggregated across the entire company, including median issue cycle time, median PR cycle time, total PR throughput, and total AI adoption lines.",
        inputSchema: {
            type: "object",
            properties: {
                format: { type: "string", default: "json", description: "Response format" },
                start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" }
            },
            required: []
        },
        endpoint: "/endpoints/export/v0/ai_impact/company_impact_analytics"
    }),

    new ApiTool({
        name: "ai_person_adoption",
        description: "Returns per-tool AI adoption usage dates for the specified people, with a breakdown by each configured tool.",
        inputSchema: {
            type: "object",
            properties: {
                format: { type: "string", default: "json", description: "Response format" },
                start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                person_id: { type: "array", items: { type: "integer" }, description: "List of person IDs" }
            },
            required: ["person_id"]
        },
        endpoint: "/endpoints/export/v0/ai_impact/person_adoption"
    }),

    new ApiTool({
        name: "ai_person_adoption_analytics",
        description: "Returns per-tool AI adoption analytics for the specified people, including cohort and usage percentage.",
        inputSchema: {
            type: "object",
            properties: {
                format: { type: "string", default: "json", description: "Response format" },
                start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                person_id: { type: "array", items: { type: "integer" }, description: "List of person IDs" }
            },
            required: ["person_id"]
        },
        endpoint: "/endpoints/export/v0/ai_impact/person_adoption_analytics"
    }),

    new ApiTool({
        name: "ai_team_impact_analytics",
        description: "Returns per-tool AI impact analytics for the specified teams, including median issue cycle time, median PR cycle time, and total PR throughput.",
        inputSchema: {
            type: "object",
            properties: {
                format: { type: "string", default: "json", description: "Response format" },
                start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                team_id: { type: "array", items: { type: "integer" }, description: "List of Jellyfish team IDs" }
            },
            required: ["team_id"]
        },
        endpoint: "/endpoints/export/v0/ai_impact/team_impact_analytics"
    }),

    new ApiTool({
        name: "ai_team_adoption_analytics",
        description: "Returns per-tool AI adoption analytics aggregated by team, including cohort counts and average usage percentage.",
        inputSchema: {
            type: "object",
            properties: {
                format: { type: "string", default: "json", description: "Response format" },
                start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                team_id: { type: "array", items: { type: "integer" }, description: "List of team IDs" }
            },
            required: ["team_id"]
        },
        endpoint: "/endpoints/export/v0/ai_impact/team_adoption_analytics"
    }),

    new ApiTool({
        name: "search_articles",
        description: "Search Jellyfish help center articles using full-text search. Handles natural language queries. Note: the help center covers a limited set of topics and may not have articles for every question.",
        inputSchema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search query - can be natural language (e.g., 'How do I set up GitHub Copilot?')." }
            },
            required: ["query"]
        },
        endpoint: "/endpoints/export/v0/mcp/help_center/search"
    }),

    new ApiTool({
        name: "get_article",
        description: "Retrieve full content of a specific Jellyfish help center article by ID.",
        inputSchema: {
            type: "object",
            properties: {
                article_id: { type: "integer", description: "Help center article ID" }
            },
            required: ["article_id"]
        },
        // override call to handle dynamic endpoint with article_id
        call({ article_id, ...rest }) {
            return api_generic(`/endpoints/export/v0/mcp/help_center/article/${article_id}`, rest);
        }
    }),
];


export class ApiToolRegistry {
    /**
     * Registry of all ApiTool instances.
     * Provides list and lookup access for the MCP server handlers.
     */
    static #byName = Object.fromEntries(apiTools.map(t => [t.name, t]));

    static listDefinitions() { return apiTools.map(t => t.toToolDefinition()); }
    static lookup(name) { return this.#byName[name]; }
}
