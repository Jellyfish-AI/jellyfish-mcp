/**
 * Team Picker
 *
 * Returns the list of teams as structured JSON.
 * Used by the allocations chart iframe to populate its team dropdown.
 */

import * as api from "../api.js";
import { McpAppParams } from './util.js';

export class TeamsParams extends McpAppParams {
    static get fields() {
        return {
            hierarchy_level: { type: "integer", description: "Org-level hierarchy. Defaults to 3." },
        };
    }

    static get defaults() {
        return {
            hierarchy_level: 3,
        };
    }

    static get required() { return []; }
}

export async function handleTeamPicker(teamsParams) {
    const data = await api.api_list_teams({ ...teamsParams, format: "json" });
    const teams = Array.isArray(data) ? data : (data?.data || data?.entries || []);
    const clean = teams
        .filter(t => t && (t.active === undefined || t.active))
        .map(t => ({ id: String(t.id), name: t.name }));

    return {
        content: [{ type: "text", text: `Loaded ${clean.length} teams.` }],
        structuredContent: { teams: clean }
    };
}
