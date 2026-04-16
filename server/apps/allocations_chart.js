// MCP App: Allocations Chart
//
// Handlers + resources for the interactive allocations chart rendered
// inline in chat via MCP Apps.
// See: https://modelcontextprotocol.io/extensions/apps/overview

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as api from "../api.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// The URI the host uses to fetch the UI resource from the server.
// "ui://" is an MCP Apps scheme — the host resolves it via ReadResource,
// not over HTTP. The server registers this in ListResources and serves
// the HTML when the host requests it.
export const ALLOCATIONS_CHART_UI_URI = "ui://jellyfish/allocations-chart";

// The actual HTML/JS/CSS for the chart, loaded once at startup.
// This is what gets returned in ReadResource and rendered in the iframe.
const TEAM_PICKER_SNIPPET = readFileSync(
    join(__dirname, '..', 'ui', 'team-picker-snippet.html'),
    'utf8'
);

export const ALLOCATIONS_CHART_HTML = readFileSync(
    join(__dirname, '..', 'ui', 'allocations-chart.html'),
    'utf8'
).replace('<!-- TEAM_PICKER -->', TEAM_PICKER_SNIPPET);

// _meta is attached to every tool result that should trigger UI rendering.
// When the host sees _meta with a ui/resourceUri, it:
//   1. Fetches the UI resource (the HTML above) via ReadResource
//   2. Renders it in a sandboxed iframe inline in the chat
//   3. Pushes the tool result's structuredContent into the iframe via postMessage
//
// Two keys carry the same URI for compatibility:
//   "ui/resourceUri" — canonical key from the MCP Apps SDK (RESOURCE_URI_META_KEY)
//   "ui.resourceUri" — nested form some hosts also check
//
// csp (Content Security Policy) controls what the iframe can load:
//   resourceDomains — origins the iframe can fetch scripts/styles from
//                     (esm.sh hosts React, Recharts, and the MCP Apps client SDK)
//   connectDomains — origins the iframe can make network requests to
//                    (empty — all data flows through the postMessage bridge, not HTTP)
export const ALLOCATIONS_CHART_META = {
    "ui/resourceUri": ALLOCATIONS_CHART_UI_URI,
    ui: {
        resourceUri: ALLOCATIONS_CHART_UI_URI,
        csp: {
            resourceDomains: ["https://esm.sh"],
            connectDomains: []
        }
    }
};

// --- Tool handlers ---

import { McpAppParams } from './util.js';

const _today = () => new Date().toISOString().slice(0, 10);
const _90daysAgo = () => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10); };

export class ChartParams extends McpAppParams {
    static get fields() {
        return {
            start_date:                 { type: "string",  description: "Start date (YYYY-MM-DD). Defaults to 90 days ago." },
            end_date:                   { type: "string",  description: "End date (YYYY-MM-DD). Defaults to today." },
            unit:                       { type: "string",  description: 'Time unit ("quarter", "month", "week"). Defaults to "month".' },
            series:                     { type: "boolean", description: "Return monthly buckets instead of one aggregate. Defaults to true." },
            team_hierarchy_level:       { type: "integer", description: "Org-level hierarchy for team aggregation. Defaults to 3." },
            team_name:                  { type: "string",  description: "If set, filters returned entries to only this team name." },
            max_n_allocation_card_keys: { type: "integer", description: "Limits card keys per entry. Defaults to 0 (totals only)." },
        };
    }

    static get defaults() {
        return {
            start_date: _90daysAgo(),
            end_date: _today(),
            unit: "month",
            series: true,
            team_hierarchy_level: 3,
            team_name: null,
            max_n_allocation_card_keys: 0,
        };
    }

    static get required() { return []; }
}

export async function handleAllocationsChart(chartParams) {
    const data = await api.api_allocations_by_investment_category_team({ ...chartParams, format: "json" });

    if (chartParams.team_name && data && !data.error) {
        const want = chartParams.team_name;
        const buckets = Array.isArray(data) ? data : (data?.data || data?.entries || [data]);
        for (const b of buckets) {
            if (Array.isArray(b?.entries)) {
                b.entries = b.entries.filter(e => e?.team?.name === want);
            }
        }
    }

    const summary = data && data.error
        ? `Error rendering allocations chart: ${data.error}${data.message ? `\n${data.message}` : ''}`
        : `Rendering interactive allocations chart for ${chartParams.start_date} to ${chartParams.end_date} (unit=${chartParams.unit}, team_hierarchy_level=${chartParams.team_hierarchy_level}).`;

    return {
        content: [{ type: "text", text: summary }],
        structuredContent: (data && !data.error)
            ? { entries: Array.isArray(data) ? data : (data?.data || data?.entries || [data]), params: chartParams }
            : { error: data?.error, message: data?.message },
        _meta: ALLOCATIONS_CHART_META
    };
}

