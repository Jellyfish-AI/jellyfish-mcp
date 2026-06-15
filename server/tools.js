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
function get_current_date_local(timezone) {
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

    new ApiTool({
        name: "get_current_date",
        description: "Returns today's date in the specified timezone (default UTC). Call this BEFORE computing any relative date like \"yesterday\", \"last week\", \"this quarter\", \"last Monday\". Today's date is not in your context — guessing it from training data leads to wrong-year errors that downstream tools (e.g. search_deliverables) will reject. After calling, use the returned `date` to compute ISO bounds for timeframe_start / timeframe_end. The `day_of_week` field helps with weekday-relative queries.",
        inputSchema: {
            type: "object",
            properties: {
                timezone: { type: "string", description: "IANA timezone name, e.g. \"America/New_York\", \"Europe/London\", \"UTC\". Defaults to UTC if omitted." }
            },
            required: []
        },
        call({ timezone } = {}) {
            return get_current_date_local(timezone);
        }
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
