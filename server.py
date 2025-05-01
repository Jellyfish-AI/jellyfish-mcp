from mcp.server.fastmcp import FastMCP, Context
import requests
import keyring
import json
import yaml  # Add PyYAML for YAML parsing
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
import os
from llamafirewall.scanners.promptguard_utils import PromptGuard

# API configuration
API_BASE_URL = "https://app.jellyfish.co"
SCHEMA_URL = f"{API_BASE_URL}/endpoints/export/v0/schema"  # Specific URL for schema

# Get API token from environment, if available.
API_TOKEN = os.getenv("JELLYFISH_API_TOKEN")
if not API_TOKEN:
    # If not found in environment, try to get it from keyring
    API_TOKEN = keyring.get_password('jellyfish', 'api_token')
    if not API_TOKEN:
        raise ValueError(
            "No JELLYFISH_API_TOKEN environment variable or jellyfish keyring entry found.\n\n"
            "Please set the credential in your keyring or as an environment variable.\n"
            "(Preferred) Set via keyring by running:\n\n"
            "    uv run python -m keyring set jellyfish api_token\n\n"
            "Or, set it in your Claude Desktop config file."
        )

HEADERS = {"Authorization": f"Token {API_TOKEN}"}

# Store API schema globally
api_schema = None


# Function to fetch and process the schema
def fetch_schema(ctx: Context):
    global api_schema
    ctx.log("info", f"Attempting to fetch schema from: {SCHEMA_URL}")

    try:
        response = requests.get(SCHEMA_URL, headers=HEADERS)
        ctx.log("info", f"Response status code: {response.status_code}")

        if response.status_code == 200:
            api_schema = yaml.safe_load(response.text)
            return True
        else:
            ctx.log("info", f"Failed to fetch schema: HTTP {response.status_code}")
            ctx.log("info", response.text)
            return False
    except yaml.YAMLError as e:
        ctx.log("info", f"Failed to parse YAML response: {str(e)}")
        ctx.log("info", f"Raw response: {response.text}")
        return False
    except requests.exceptions.RequestException as e:
        ctx.log("info", f"Request failed: {str(e)}")
        return False


# Returns True if the API response is valid, False otherwise
def validate_api_response(data: json) -> bool:
    prompt_guard = PromptGuard()

    score = prompt_guard.get_jailbreak_score(data)

    print(f"PromptGuard score: {score}")


    return True

# Initialize server with lifespan
mcp = FastMCP("Jellyfish API Server")

# Resource to get the API schema
@mcp.resource("schema://api")
def get_api_schema() -> str:
    """Get the complete API schema with all available endpoints"""
    global api_schema

    if api_schema is None:
        fetch_schema(mcp.get_context())

    if api_schema:
        # Format the schema as a readable string
        return json.dumps(api_schema, indent=2)
    else:
        return "Schema not available. Failed to fetch from API."


# Tool to list all available endpoints
@mcp.tool()
def list_endpoints(ctx: Context) -> dict:
    """List all available API endpoints with their descriptions"""
    global api_schema

    if api_schema is None:
        if not fetch_schema(ctx):
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
def get_endpoint(endpoint_path: str, ctx: Context, params: dict = None) -> dict:
    """
    Make a GET request to any API endpoint

    Args:
        endpoint_path: The path to append to the base URL (without leading slash)
        params: Optional query parameters
    """
    # The endpoint_path from the schema already includes /endpoints/export/v0/
    url = f"{API_BASE_URL}/{endpoint_path.lstrip('/')}"
    ctx.log("info", f"\nAttempting API request to: {url}")
    ctx.log("info", f"With params: {params}")

    response = requests.get(url, headers=HEADERS, params=params)
    ctx.log("info", f"Response status: {response.status_code}")
    ctx.log("info", 
        f"Response text: {response.text[:500]}..."
    )  # Print first 500 chars of response

    if response.status_code == 200:
        return response.json()
    else:
        return {
            "error": f"Request failed: HTTP {response.status_code}",
            "message": response.text,
        }


# --- ALLOCATIONS ---

@mcp.tool()
def allocations_by_person(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    decimal_places: int = None,
) -> dict:
    """
    Returns allocation data for the whole company, aggregated by person.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
        decimal_places (int, optional): Number of decimal places (1-3).
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/allocations/details/by_person"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def allocations_by_team(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    decimal_places: int = None,
    team_hierarchy_level: int = None,
    include_person_breakout: bool = None,
) -> dict:
    """
    Returns allocation data for the whole company, aggregated by team at the specified hierarchy level.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
        decimal_places (int, optional): Number of decimal places (1-3).
        team_hierarchy_level (int, required): Org level (1-3).
        include_person_breakout (bool, optional): Include person details.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/allocations/details/by_team"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def allocations_by_investment_category(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    decimal_places: int = None,
) -> dict:
    """
    Returns allocation data for the whole company, aggregated by investment category.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
        decimal_places (int, optional): Number of decimal places (1-3).
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/allocations/details/investment_category"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def allocations_by_investment_category_person(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    decimal_places: int = None,
) -> dict:
    """
    Returns allocation data for the whole company, aggregated by investment category and person.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
        decimal_places (int, optional): Number of decimal places (1-3).
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/allocations/details/investment_category/by_person"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def allocations_by_investment_category_team(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    decimal_places: int = None,
    team_hierarchy_level: int = None,
    include_person_breakout: bool = None,
) -> dict:
    """
    Returns allocation data for the whole company, aggregated by investment category and team at the specified hierarchy level.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
        decimal_places (int, optional): Number of decimal places (1-3).
        team_hierarchy_level (int, required): Org level (1-3).
        include_person_breakout (bool, optional): Include person details.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/allocations/details/investment_category/by_team"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def allocations_by_work_category(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    decimal_places: int = None,
    work_category_slug: str = None,
) -> dict:
    """
    Returns allocation data for the whole company, aggregated by deliverable within the specified work category.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
        decimal_places (int, optional): Number of decimal places (1-3).
        work_category_slug (str, required): Work category slug.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/allocations/details/work_category"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def allocations_by_work_category_person(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    decimal_places: int = None,
    work_category_slug: str = None,
) -> dict:
    """
    Returns allocation data for the whole company, aggregated by deliverable within the specified work category and person.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
        decimal_places (int, optional): Number of decimal places (1-3).
        work_category_slug (str, required): Work category slug.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/allocations/details/work_category/by_person"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def allocations_by_work_category_team(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    decimal_places: int = None,
    team_hierarchy_level: int = None,
    work_category_slug: str = None,
    include_person_breakout: bool = None,
) -> dict:
    """
    Returns allocation data for the whole company, aggregated by deliverable within the specified work category and team at the specified hierarchy level.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
        decimal_places (int, optional): Number of decimal places (1-3).
        team_hierarchy_level (int, required): Org level (1-3).
        work_category_slug (str, required): Work category slug.
        include_person_breakout (bool, optional): Include person details.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/allocations/details/work_category/by_team"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def allocations_filter_fields(
    format: str = "json"
) -> dict:
    """
    Returns a list of the available fields and known values for filtering allocations.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
    """
    params = {"format": format}
    url = f"{API_BASE_URL}/endpoints/export/v0/allocations/filter_fields"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def allocations_summary_by_investment_category(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    decimal_places: int = None,
    team_id: list = None,
    role: list = None,
    location: list = None,
    custom_column_laptop: list = None,
) -> dict:
    """
    Returns total FTE amounts for investment categories. Supports filtering.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week", "sprint").
        series (bool, optional): Whether to return series data.
        decimal_places (int, optional): Number of decimal places (1-3).
        team_id (list, optional): List of team IDs.
        role (list, optional): List of roles.
        location (list, optional): List of locations.
        custom_column_laptop (list, optional): List of laptop types.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None and v != []}
    url = f"{API_BASE_URL}/endpoints/export/v0/allocations/summary_filtered/by_investment_category"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def allocations_summary_by_work_category(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    decimal_places: int = None,
    team_id: list = None,
    role: list = None,
    location: list = None,
    work_category_slug: str = None,
    custom_column_laptop: list = None,
) -> dict:
    """
    Returns total FTE amounts for deliverables within a work category. Supports filtering.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week", "sprint").
        series (bool, optional): Whether to return series data.
        decimal_places (int, optional): Number of decimal places (1-3).
        team_id (list, optional): List of team IDs.
        role (list, optional): List of roles.
        location (list, optional): List of locations.
        work_category_slug (str, required): Work category slug.
        custom_column_laptop (list, optional): List of laptop types.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None and v != []}
    url = f"{API_BASE_URL}/endpoints/export/v0/allocations/summary_filtered/by_work_category"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

# --- DELIVERY ---

@mcp.tool()
def deliverable_details(
    format: str = "json",
    deliverable_id: int = None,
) -> dict:
    """
    Returns data about a specific deliverable.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        deliverable_id (int, required): Jellyfish deliverable id.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/delivery/deliverable_details"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def deliverable_scope_and_effort_history(
    format: str = "json",
    deliverable_id: int = None,
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
) -> dict:
    """
    Returns weekly data about the scope of a deliverable and the total effort allocated per week.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        deliverable_id (int, required): Jellyfish deliverable id.
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/delivery/scope_and_effort_history"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def work_categories(
    format: str = "json"
) -> dict:
    """
    Returns a list of all known work categories.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
    """
    params = {"format": format}
    url = f"{API_BASE_URL}/endpoints/export/v0/delivery/work_categories"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def work_category_contents(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    work_category_slug: str = None,
    completed_only: bool = None,
    inprogress_only: bool = None,
    view_archived: bool = None,
    team_id: list = None,
) -> dict:
    """
    Returns data about the deliverables in a specified work category.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
        work_category_slug (str, required): Work category slug.
        completed_only (bool, optional): Only completed deliverables.
        inprogress_only (bool, optional): Only in-progress deliverables.
        view_archived (bool, optional): Include archived deliverables.
        team_id (list, optional): List of team IDs.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None and v != []}
    url = f"{API_BASE_URL}/endpoints/export/v0/delivery/work_category_contents"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

# --- METRICS ---

@mcp.tool()
def company_metrics(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
) -> dict:
    """
    Returns metrics data for the company during the specified timeframe.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/metrics/company_metrics"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def person_metrics(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    person_id: list = None,
) -> dict:
    """
    Returns metrics data for the specified person during the specified timeframe.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
        person_id (list, required): List of person IDs.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None and v != []}
    url = f"{API_BASE_URL}/endpoints/export/v0/metrics/person_metrics"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def team_metrics(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    team_id: list = None,
) -> dict:
    """
    Returns metrics data for the specified team during the specified timeframe.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week", "sprint").
        series (bool, optional): Whether to return series data.
        team_id (list, required): List of team IDs.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None and v != []}
    url = f"{API_BASE_URL}/endpoints/export/v0/metrics/team_metrics"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def team_sprint_summary(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    team_id: int = None,
) -> dict:
    """
    Returns issue count and, if available, story point data for a team's sprints in the specified timeframe.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        team_id (int, required): Team ID.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/metrics/team_sprint_summary"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def unlinked_pull_requests(
    format: str = "json",
    start_date: str = None,
    end_date: str = None,
    unit: str = None,
    series: bool = None,
    instance_slug: list = None,
    organization_name: list = None,
    repo_name: list = None,
) -> dict:
    """
    Lists details of unlinked pull requests merged during the specified timeframe.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        start_date (str, optional): Start date (YYYY-MM-DD).
        end_date (str, optional): End date (YYYY-MM-DD).
        unit (str, optional): Time unit ("quarter", "month", "week").
        series (bool, optional): Whether to return series data.
        instance_slug (list, optional): List of git instance slugs.
        organization_name (list, optional): List of organization names.
        repo_name (list, optional): List of repository names.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None and v != []}
    url = f"{API_BASE_URL}/endpoints/export/v0/metrics/unlinked_pull_requests"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

# --- PEOPLE ---

@mcp.tool()
def list_engineers(
    format: str = "json",
    effective_date: str = None,
) -> dict:
    """
    Returns a list of all active allocatable people as of a specific date.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        effective_date (str, optional): Effective date (YYYY-MM-DD).
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/people/list_engineers"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def search_people(
    format: str = "json",
    name: list = None,
    email: list = None,
    person_id: list = None,
) -> dict:
    """
    Searches for people by name, email, or id.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        name (list, optional): List of names.
        email (list, optional): List of emails.
        person_id (list, optional): List of person IDs.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None and v != []}
    url = f"{API_BASE_URL}/endpoints/export/v0/people/search"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

# --- TEAMS ---

@mcp.tool()
def list_teams(
    format: str = "json",
    hierarchy_level: int = None,
    include_children: bool = None,
) -> dict:
    """
    Displays all teams at the specified hierarchy level. Optionally, includes child teams.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        hierarchy_level (int, required): Team hierarchy level.
        include_children (bool, optional): Whether to include child teams.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None}
    url = f"{API_BASE_URL}/endpoints/export/v0/teams/list_teams"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

@mcp.tool()
def search_teams(
    format: str = "json",
    name: list = None,
    team_id: list = None,
) -> dict:
    """
    Searches for teams by name or id.

    Parameters:
        format (str, optional): Response format ("json" or "csv"). Default "json".
        name (list, optional): List of team names.
        team_id (list, optional): List of team IDs.
    """
    params = {k: v for k, v in locals().items() if k != "params" and v is not None and v != []}
    url = f"{API_BASE_URL}/endpoints/export/v0/teams/search"
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.status_code == 200 else {"error": f"HTTP {response.status_code}", "message": response.text}

# Run the server
if __name__ == "__main__":
    mcp.run()
