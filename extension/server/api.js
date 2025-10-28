// Jellyfish API client for Node.js
import yaml from 'js-yaml';
import { sanitize_api_response } from './sanitizer.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
const __version__ = packageJson.version;

// Get API token from environment variable
const API_TOKEN = process.env.JELLYFISH_API_TOKEN;
if (!API_TOKEN) {
    throw new Error("No Jellyfish API key found");
}

// Get schema URL from API base URL
const API_BASE_URL = "https://app.jellyfish.co";
const SCHEMA_URL = `${API_BASE_URL}/endpoints/export/v0/schema`;
let apiSchema = null; // Store API schema globally

// Get headers for API requests
const HEADERS = {
    "Authorization": `Token ${API_TOKEN}`,
    "User-Agent": `jellyfish-mcp/${__version__} (Node.js)`
};

// Function to fetch and process the schema
async function fetch_schema() {
    try {
        const response = await fetch(SCHEMA_URL, { headers: HEADERS });

        if (response.ok) {
            const responseText = await response.text();
            apiSchema = yaml.load(responseText);
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}


// --- SCHEMA ---
export async function api_get_api_schema() {
    if (apiSchema === null) {
        await fetch_schema();
    }

    if (apiSchema) {
        return sanitize_api_response(apiSchema);
    } else {
        return { "error": "Schema not available. Failed to fetch from API." };
    }
}

// --- LIST ENDPOINTS ---
export async function api_list_endpoints() {
    if (apiSchema === null) {
        if (!await fetch_schema()) {
            return { "error": "Failed to fetch API schema" };
        }
    }
    
    if (apiSchema === null) {
        return { "error": "Failed to fetch API schema" };
    }

    // Extract endpoint information from schema
    const endpoints = {};

    // Extract path information from the schema
    const paths = apiSchema.paths || {};
    for (const [path, pathInfo] of Object.entries(paths)) {
        endpoints[path] = {
            "methods": Object.keys(pathInfo),
            "description": pathInfo.description || "",
        };
    }

    return await sanitize_api_response(endpoints);
}

// --- GENERIC API CALL FUNCTION ---
async function api_generic(endpoint, params = {}) {
    const url = new URL(endpoint, API_BASE_URL);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            // Handle arrays by adding each element as a separate parameter
            if (Array.isArray(params[key])) {
                params[key].forEach(value => {
                    url.searchParams.append(key, value);
                });
            } else {
                url.searchParams.append(key, params[key]);
            }
        }
    });

    try {
        const response = await fetch(url, { headers: HEADERS });
        
        if (response.ok) {
            const data = await response.json();
            return await sanitize_api_response(JSON.stringify(data));
        } else {
            const errorText = await response.text();
            return { 
                "error": `HTTP ${response.status}`, 
                "message": errorText 
            };
        }
    } catch (error) {
        return { 
            "error": "Request failed", 
            "message": error.message 
        };
    }
}

// --- ALLOCATIONS ---
export async function api_allocations_by_person(params = {}) {
    const endpoint = "/endpoints/export/v0/allocations/details/by_person";
    return await api_generic(endpoint, params);
}

export async function api_allocations_by_team(params = {}) {
    const endpoint = "/endpoints/export/v0/allocations/details/by_team";
    return await api_generic(endpoint, params);
}

export async function api_allocations_by_investment_category(params = {}) {
    const endpoint = "/endpoints/export/v0/allocations/details/investment_category";
    return await api_generic(endpoint, params);
}

export async function api_allocations_by_investment_category_person(params = {}) {
    const endpoint = "/endpoints/export/v0/allocations/details/investment_category/by_person";
    return await api_generic(endpoint, params);
}

export async function api_allocations_by_investment_category_team(params = {}) {
    const endpoint = "/endpoints/export/v0/allocations/details/investment_category/by_team";
    return await api_generic(endpoint, params);
}

export async function api_allocations_by_work_category(params = {}) {
    const endpoint = "/endpoints/export/v0/allocations/details/work_category";
    return await api_generic(endpoint, params);
}

export async function api_allocations_by_work_category_person(params = {}) {
    const endpoint = "/endpoints/export/v0/allocations/details/work_category/by_person";
    return await api_generic(endpoint, params);
}

export async function api_allocations_by_work_category_team(params = {}) {
    const endpoint = "/endpoints/export/v0/allocations/details/work_category/by_team";
    return await api_generic(endpoint, params);
}

export async function api_allocations_filter_fields(params = {}) {
    const endpoint = "/endpoints/export/v0/allocations/filter_fields";
    return await api_generic(endpoint, params);
}

export async function api_allocations_summary_by_investment_category(params = {}) {
    const endpoint = "/endpoints/export/v0/allocations/summary_filtered/by_investment_category";
    return await api_generic(endpoint, params);
}

export async function api_allocations_summary_by_work_category(params = {}) {
    const endpoint = "/endpoints/export/v0/allocations/summary_filtered/by_work_category";
    return await api_generic(endpoint, params);
}

// --- DELIVERY ---
export async function api_deliverable_details(params = {}) {
    const endpoint = "/endpoints/export/v0/delivery/deliverable_details";
    return await api_generic(endpoint, params);
}

export async function api_deliverable_scope_and_effort_history(params = {}) {
    const endpoint = "/endpoints/export/v0/delivery/scope_and_effort_history";
    return await api_generic(endpoint, params);
}

export async function api_work_categories(params = {}) {
    const endpoint = "/endpoints/export/v0/delivery/work_categories";
    return await api_generic(endpoint, params);
}

export async function api_work_category_contents(params = {}) {
    const endpoint = "/endpoints/export/v0/delivery/work_category_contents";
    return await api_generic(endpoint, params);
}

// --- METRICS ---
export async function api_company_metrics(params = {}) {
    const endpoint = "/endpoints/export/v0/metrics/company_metrics";
    return await api_generic(endpoint, params);
}

export async function api_person_metrics(params = {}) {
    const endpoint = "/endpoints/export/v0/metrics/person_metrics";
    return await api_generic(endpoint, params);
}

export async function api_team_metrics(params = {}) {
    const endpoint = "/endpoints/export/v0/metrics/team_metrics";
    return await api_generic(endpoint, params);
}

export async function api_team_sprint_summary(params = {}) {
    const endpoint = "/endpoints/export/v0/metrics/team_sprint_summary";
    return await api_generic(endpoint, params);
}

export async function api_unlinked_pull_requests(params = {}) {
    const endpoint = "/endpoints/export/v0/metrics/unlinked_pull_requests";
    return await api_generic(endpoint, params);
}

// --- PEOPLE ---
export async function api_list_engineers(params = {}) {
    const endpoint = "/endpoints/export/v0/people/list_engineers";
    return await api_generic(endpoint, params);
}

export async function api_search_people(params = {}) {
    const endpoint = "/endpoints/export/v0/people/search";
    return await api_generic(endpoint, params);
}

// --- TEAMS ---
export async function api_list_teams(params = {}) {
    const endpoint = "/endpoints/export/v0/teams/list_teams";
    return await api_generic(endpoint, params);
}

export async function api_search_teams(params = {}) {
    const endpoint = "/endpoints/export/v0/teams/search";
    return await api_generic(endpoint, params);
}