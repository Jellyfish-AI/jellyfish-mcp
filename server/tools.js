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

    // ALLOCATIONS
    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/allocations/details/by_person"
    }),

    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/allocations/details/by_team"
    }),

    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/allocations/details/investment_category"
    }),

    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/allocations/details/investment_category/by_person"
    }),

    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/allocations/details/investment_category/by_team"
    }),

    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/allocations/details/work_category"
    }),

    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/allocations/details/work_category/by_person"
    }),

    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/allocations/details/work_category/by_team"
    }),

    new ApiTool({
        name: "allocations_filter_fields",
        description: "Returns a list of the available fields and known values for filtering allocations.",
        inputSchema: {
            type: "object",
            properties: {},
            required: []
        },
        endpoint: "/endpoints/export/v0/allocations/filter_fields"
    }),

    new ApiTool({
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
                team_id: { type: "array", items: { type: "string" }, description: "List of team IDs. Returns total FTE amounts for only people in these team IDs, all of which must be at the same hierarchy org level. Can include 'null' for people with no team." },
                role: { type: "array", items: { type: "string" }, description: "List of roles. Returns total FTE amounts for only people with these roles. Can include 'null' for people with no role. To check what roles are available, use the allocations_filter_fields tool." },
                location: { type: "array", items: { type: "string" }, description: "List of locations. Returns total FTE amounts for only people with these locations. Can include 'null' for people with no location. To check what locations are available, use the allocations_filter_fields tool." },
                custom_column_laptop: { type: "array", items: { type: "string" }, description: "List of laptop types. Returns total FTE amounts for only people with these custom field values. Can include 'null' for people with no value for this field. To check what values are available, use the allocations_filter_fields tool." }
            },
            required: []
        },
        endpoint: "/endpoints/export/v0/allocations/summary_filtered/by_investment_category"
    }),

    new ApiTool({
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
                team_id: { type: "array", items: { type: "string" }, description: "List of team IDs. Returns total FTE amounts for only people in these team IDs, all of which must be at the same hierarchy org level. Can include 'null' for people with no team." },
                role: { type: "array", items: { type: "string" }, description: "List of roles. Returns total FTE amounts for only people with these roles. Can include 'null' for people with no role. To check what roles are available, use the allocations_filter_fields tool." },
                location: { type: "array", items: { type: "string" }, description: "List of locations. Returns total FTE amounts for only people with these locations. Can include 'null' for people with no location. To check what locations are available, use the allocations_filter_fields tool." },
                work_category_slug: { type: "string", description: "Work category slug" },
                custom_column_laptop: { type: "array", items: { type: "string" }, description: "List of laptop types. Returns total FTE amounts for only people with these custom field values. Can include 'null' for people with no value for this field. To check what values are available, use the allocations_filter_fields tool." }
            },
            required: ["work_category_slug"]
        },
        endpoint: "/endpoints/export/v0/allocations/summary_filtered/by_work_category"
    }),

    // DELIVERY
    new ApiTool({
        name: "deliverable_details",
        description: "Returns data about a specific deliverable.",
        inputSchema: {
            type: "object",
            properties: {
                format: { type: "string", default: "json", description: "Response format" },
                deliverable_id: { type: "integer", description: "Jellyfish deliverable id" }
            },
            required: ["deliverable_id"]
        },
        endpoint: "/endpoints/export/v0/delivery/deliverable_details"
    }),

    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/delivery/scope_and_effort_history"
    }),

    new ApiTool({
        name: "work_categories",
        description: "Returns a list of all known work categories.",
        inputSchema: {
            type: "object",
            properties: {},
            required: []
        },
        endpoint: "/endpoints/export/v0/delivery/work_categories"
    }),

    new ApiTool({
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
                team_id: { type: "array", items: { type: "integer" }, description: "List of team IDs" }
            },
            required: ["work_category_slug"]
        },
        endpoint: "/endpoints/export/v0/delivery/work_category_contents"
    }),

    // DEVEX
    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/devex/insights/by_team"
    }),

    // METRICS
    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/metrics/company_metrics"
    }),

    new ApiTool({
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
                person_id: { type: "array", items: { type: "integer" }, description: "List of person IDs" }
            },
            required: ["person_id"]
        },
        endpoint: "/endpoints/export/v0/metrics/person_metrics"
    }),

    new ApiTool({
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
                team_id: { type: "array", items: { type: "integer" }, description: "List of team IDs" }
            },
            required: ["team_id"]
        },
        endpoint: "/endpoints/export/v0/metrics/team_metrics"
    }),

    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/metrics/team_sprint_summary"
    }),

    new ApiTool({
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
                instance_slug: { type: "array", items: { type: "string" }, description: "List of git instance slugs" },
                organization_name: { type: "array", items: { type: "string" }, description: "List of organization names" },
                repo_name: { type: "array", items: { type: "string" }, description: "List of repository names" }
            },
            required: []
        },
        endpoint: "/endpoints/export/v0/metrics/unlinked_pull_requests"
    }),

    // PEOPLE
    new ApiTool({
        name: "list_engineers",
        description: "Returns a list of all active allocatable people as of a specific date.",
        inputSchema: {
            type: "object",
            properties: {
                format: { type: "string", default: "json", description: "Response format" },
                effective_date: { type: "string", description: "Effective date (YYYY-MM-DD)" }
            },
            required: []
        },
        endpoint: "/endpoints/export/v0/people/list_engineers"
    }),

    new ApiTool({
        name: "search_people",
        description: "Searches for people by name, email, or id.",
        inputSchema: {
            type: "object",
            properties: {
                format: { type: "string", default: "json", description: "Response format" },
                name: { type: "array", items: { type: "string" }, description: "List of names" },
                email: { type: "array", items: { type: "string" }, description: "List of emails" },
                person_id: { type: "array", items: { type: "integer" }, description: "List of person IDs" }
            },
            required: []
        },
        endpoint: "/endpoints/export/v0/people/search"
    }),

    // TEAMS
    new ApiTool({
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
        },
        endpoint: "/endpoints/export/v0/teams/list_teams"
    }),

    new ApiTool({
        name: "search_teams",
        description: "Searches for teams by name or id. It does not include child or parent information. It returns id, name, active, hierarchy_level, and hierarchy_level_name. Note: While name and team_id are both optional, at least one must be provided.",
        inputSchema: {
            type: "object",
            properties: {
                format: { type: "string", default: "json", description: "Response format" },
                name: { type: "array", items: { type: "string" }, description: "List of team names" },
                team_id: { type: "array", items: { type: "integer" }, description: "List of team IDs" }
            },
            required: []
        },
        endpoint: "/endpoints/export/v0/teams/search"
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
