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

// Returns today's date/time in the requested IANA timezone (default UTC).
// Implemented locally — no Django round-trip needed; this is pure clock data.
// Exists because models don't have reliable access to "now" and produce
// wrong-year dates otherwise; downstream tools (e.g. search_deliverables)
// then reject those dates via their timeframe clamps.
export function get_current_date_local(timezone) {
    const tz = timezone || "UTC";
    let parts;
    try {
        parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            weekday: 'long',
        }).formatToParts(new Date());
    } catch (e) {
        return { error: `Invalid timezone: ${tz}. Use IANA names like "America/New_York", "Europe/London", or "UTC".` };
    }
    const part = (t) => parts.find(p => p.type === t).value;
    // Node's Intl quirk: hour12:false can return "24" at midnight on some platforms.
    let hour = part('hour');
    if (hour === '24') hour = '00';
    const date = `${part('year')}-${part('month')}-${part('day')}`;
    const time = `${hour}:${part('minute')}:${part('second')}`;
    return {
        date,
        datetime: `${date}T${time}`,
        timezone: tz,
        day_of_week: part('weekday'),
    };
}

const apiTools = [
    // AI IMPACT
    new ApiTool({
        name: "ai_company_adoption_analytics",
        description: "Returns per-tool AI adoption analytics aggregated across the entire company, including cohort counts and average usage percentage.",
        inputSchema: {
            type: "object",
            properties: {
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
                start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
                end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
                unit: { type: "string", description: "Time unit (\"quarter\", \"month\", \"week\")" },
                team_id: { type: "array", items: { type: "integer" }, description: "List of team IDs" }
            },
            required: ["team_id"]
        },
        endpoint: "/endpoints/export/v0/ai_impact/team_adoption_analytics"
    }),

    // ALLOCATIONS
    new ApiTool({
        name: "allocations_by_person",
        description: "Returns allocation data for the whole company, aggregated by person.",
        inputSchema: {
            type: "object",
            properties: {
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
        name: "deliverable_scope_and_effort_history",
        description: "Returns weekly data about the scope of a deliverable and the total effort allocated per week.",
        inputSchema: {
            type: "object",
            properties: {
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
        name: "get_deliverable",
        description: "Fetch a single deliverable by id. A deliverable is a tracked work item (Initiative, Pillar, Epic, etc.) belonging to one work_category. Use when you have a specific id (typically from a search_deliverables row) and want detail on that one item.",
        inputSchema: {
            type: "object",
            properties: {
                deliverable_id: { type: "integer", description: "Deliverable id." },
                expand: { type: "string", description: "Comma-separated. Valid: subdeliverables, investment_breakdown." }
            },
            required: ["deliverable_id"]
        },
        call({ deliverable_id, ...rest }) {
            return api_generic(`/endpoints/export/v0/mcp/get_deliverable/${deliverable_id}`, rest);
        }
    }),

    new ApiTool({
        name: "search_deliverables",
        description: "A deliverable is a tracked work item (Initiative, Pillar, Epic, etc.) belonging to one work_category. Use this to answer questions about what work is happening, planned, late, stalled, or completed. All params are optional. Category scope is automatic: if `team` is set the search covers every category for that team (the team's vertical view); otherwise it defaults to the topmost category in the company hierarchy (usually initiatives) — pass `work_category` explicitly to drill into a different level. Returns {items, limit, hint?}. When `items` is empty the response includes a `hint` string with mode-aware advice for the next query — FOLLOW the hint, don't retry with permutations of work_category or other params. Narrow filters when items.length equals limit (the answer may be truncated). Default timeframe is roughly the last three calendar months ending today when no dates are given.\n\nTime-bounded queries use one unified window: timeframe_start / timeframe_end. A deliverable matches if it had real allocation activity in the window OR completed in the window. \"Active\" is allocation-based (AllocEntry rows), so a long-shipped deliverable that gets a stray issue touch later will NOT show up in a recent window. Pair with activity_status to narrow — e.g. timeframe=Q1 + activity_status=[\"completed\"] for \"what shipped in Q1\"; timeframe=Q1 alone for \"anything that happened in Q1\". For relative date queries (\"yesterday\", \"last week\", \"this quarter\") call get_current_date FIRST — today's date is not in your context and stale training cutoffs cause wrong-year errors that the timeframe clamps will reject.\n\nHierarchy collapse is automatic — rows whose parent is also in the result set drop out so multi-level chains return only the topmost visible row. To drill into one deliverable's children, use parent_id.",
        inputSchema: {
            type: "object",
            properties: {
                deliverable: { type: "string", description: "Substring lookup against deliverable name and source-issue summary, case-insensitive." },
                work_category: { type: "string", description: "Optional. Pass the user's word DIRECTLY (e.g. 'Initiatives', 'epics', 'pillar') — fuzzy resolution is built in, so calling work_categories first is NOT necessary and wastes a tool call. Accepts id, slug, exact name (singular or plural), or fuzzy name. Default behavior: if `team` is set, the search runs across every category for that team (the team's full vertical view). If `team` is not set, the search defaults to the topmost category in the company hierarchy (usually initiatives) — set this explicitly to drill into a different level (e.g. 'epics'). Do NOT loop categories yourself by calling search_deliverables once per category." },
                parent_id: { type: "integer", description: "Drill into one deliverable's children. Hierarchy collapse is disabled in this mode." },
                team: { type: "array", items: { type: "string" }, description: "Pass team names DIRECTLY (e.g. [\"Neptune\"], [\"Backend\", \"Platform\"]) — fuzzy resolution is built in, so calling search_teams first is NOT necessary and wastes a tool call. Each value can be an id, exact name, singular/plural, or fuzzy name. All resolved teams must share one hierarchy level. Allocation-based — combine with timeframe_start / timeframe_end (and optionally activity_status) for time-bounded team queries, e.g. team=[\"Neptune\"], timeframe_start=2026-01-01, timeframe_end=2026-03-31, activity_status=[\"completed\"] for \"what did Neptune ship in Q1\"." },
                activity_status: {
                    type: "array",
                    items: { type: "string", enum: ["completed", "in_progress", "all_complete", "jira_resolution", "idle", "n_a"] },
                    description: "Activity state of the deliverable."
                },
                target_date_status: {
                    type: "array",
                    items: { type: "string", enum: ["missed_target", "hit_target", "no_target", "target_upcoming"] },
                    description: "Whether the deliverable hit its target date."
                },
                projected_date_status: {
                    type: "array",
                    items: { type: "string", enum: ["behind_target", "on_target", "no_projected_date", "no_target_date"] },
                    description: "Forward-looking judgment based on projected completion vs target."
                },
                order_by: {
                    type: "string",
                    enum: ["last_work_date_asc", "last_work_date_desc", "target_date_asc", "target_date_desc", "projected_date_asc", "projected_date_desc"],
                    description: "Sort order. NULLs always sort last. No default — pick one when truncation to `limit` should be meaningful (e.g. top-N answers)."
                },
                timeframe_start: { type: "string", format: "date", description: "YYYY-MM-DD. Inclusive lower bound of the activity window. A deliverable matches if it had real allocation activity (AllocEntry rows) on or after this date OR completed on or after this date. Pair with timeframe_end for a closed window; either bound is optional. To narrow to just shipped work, add activity_status=[\"completed\"]; for active work, activity_status=[\"in_progress\"]. Defaults to 90 days ago when neither bound is set. Sanity clamps reject dates more than 2 years in the past — call get_current_date first to anchor relative dates." },
                timeframe_end: { type: "string", format: "date", description: "YYYY-MM-DD. Inclusive upper bound of the activity window. Same OR-across-columns semantics as timeframe_start. Omit to leave the window open-ended. Sanity clamp rejects any date past today. Maximum range width: 365 days — narrow further if you need a tight answer." },
                limit: { type: "integer", default: 50, description: "Max items to return. Default 50, hard max 100." }
            },
            required: []
        },
        endpoint: "/endpoints/export/v0/mcp/search_deliverables"
    }),

    // DEVEX
    new ApiTool({
        name: "devex_insights_by_team",
        description: "Returns DevEx insights data.",
        inputSchema: {
            type: "object",
            properties: {
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
                name: { type: "array", items: { type: "string" }, description: "List of team names" },
                team_id: { type: "array", items: { type: "integer" }, description: "List of team IDs" }
            },
            required: []
        },
        endpoint: "/endpoints/export/v0/teams/search"
    }),

    // HELP CENTER
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
