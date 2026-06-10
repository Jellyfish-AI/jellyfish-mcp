// Jellyfish API client for Node.js
import yaml from 'js-yaml';
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
    throw new Error("No Jellyfish API token found");
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
        return apiSchema;
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

    return endpoints;
}

// --- GENERIC API CALL FUNCTION ---
export async function api_generic(endpoint, params = {}) {
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
            return data;
        } else {
            const errorText = await response.text();
            let message = errorText;

            // Try to parse and format JSON errors
            try {
                const errorJson = JSON.parse(errorText);
                message = Object.entries(errorJson)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                    .join('\n');
            } catch {
                // Not JSON, keep as-is
            }

            return {
                "error": `HTTP ${response.status}`,
                "message": message
            };
        }
    } catch (error) {
        return {
            "error": "Request failed",
            "message": error.message
        };
    }
}


