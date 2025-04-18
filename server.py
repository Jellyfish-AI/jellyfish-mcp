from mcp.server.fastmcp import FastMCP, Context
import requests
import json
import yaml  # Add PyYAML for YAML parsing
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
import os

# API configuration
API_BASE_URL = "https://app.jellyfish.co"
SCHEMA_URL = f"{API_BASE_URL}/endpoints/export/v0/schema"  # Specific URL for schema

# Get API token from environment
API_TOKEN = os.getenv("JELLYFISH_API_TOKEN")
if not API_TOKEN:
    raise ValueError(
        "JELLYFISH_API_TOKEN environment variable is not set. "
        "Please set it in your Claude Desktop config file."
    )

HEADERS = {"Authorization": f"Token {API_TOKEN}"}

# Store API schema globally
api_schema = None


# Function to fetch and process the schema
def fetch_schema():
    global api_schema
    print(f"Attempting to fetch schema from: {SCHEMA_URL}")

    try:
        response = requests.get(SCHEMA_URL, headers=HEADERS)
        print(f"Response status code: {response.status_code}")

        if response.status_code == 200:
            api_schema = yaml.safe_load(response.text)
            return True
        else:
            print(f"Failed to fetch schema: HTTP {response.status_code}")
            print(response.text)
            return False
    except yaml.YAMLError as e:
        print(f"Failed to parse YAML response: {str(e)}")
        print(f"Raw response: {response.text}")
        return False
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {str(e)}")
        return False


@asynccontextmanager
async def server_lifespan(server: FastMCP) -> AsyncIterator[None]:
    """Fetch API schema during server startup"""
    print("Starting Jellyfish API MCP Server...")
    fetch_schema()
    try:
        yield
    finally:
        print("Shutting down Jellyfish API MCP Server...")


# Initialize server with lifespan
mcp = FastMCP("Jellyfish API Server", lifespan=server_lifespan)


# Resource to get the API schema
@mcp.resource("schema://api")
def get_api_schema() -> str:
    """Get the complete API schema with all available endpoints"""
    global api_schema

    if api_schema is None:
        fetch_schema()

    if api_schema:
        # Format the schema as a readable string
        return json.dumps(api_schema, indent=2)
    else:
        return "Schema not available. Failed to fetch from API."


# Tool to list all available endpoints
@mcp.tool()
def list_endpoints() -> dict:
    """List all available API endpoints with their descriptions"""
    global api_schema

    if api_schema is None:
        if not fetch_schema():
            return {"error": "Failed to fetch API schema"}

    # Extract endpoint information from schema
    endpoints = {}

    # This needs to be customized based on your schema structure
    # Example structure - adjust according to your actual schema:
    for path, path_info in api_schema.get("paths", {}).items():
        endpoints[path] = {
            "methods": list(path_info.keys()),
            "description": path_info.get("description", ""),
        }

    return endpoints


# Generic tool to make GET requests to any endpoint
@mcp.tool()
def get_endpoint(endpoint_path: str, params: dict = None) -> dict:
    """
    Make a GET request to any API endpoint

    Args:
        endpoint_path: The path to append to the base URL (without leading slash)
        params: Optional query parameters
    """
    # The endpoint_path from the schema already includes /endpoints/export/v0/
    url = f"{API_BASE_URL}/{endpoint_path.lstrip('/')}"
    print(f"\nAttempting API request to: {url}")
    print(f"With headers: {HEADERS}")
    print(f"With params: {params}")

    response = requests.get(url, headers=HEADERS, params=params)
    print(f"Response status: {response.status_code}")
    print(
        f"Response text: {response.text[:500]}..."
    )  # Print first 500 chars of response

    if response.status_code == 200:
        return response.json()
    else:
        return {
            "error": f"Request failed: HTTP {response.status_code}",
            "message": response.text,
        }


# Run the server
if __name__ == "__main__":
    mcp.run()
