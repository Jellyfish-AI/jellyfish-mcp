# jellyfish-mcp: A Jellyfish MCP Server

## Overview

A Model Context Protocol server for retrieving and analyzing data from Jellyfish's API. This server allows a host (e.g. Claude Desktop or Cursor) to interact with your Jellyfish instance, enabling natural language queries about your engineering metrics, team data, and other information available through the Jellyfish API.

### Tools

The server provides several tools for interacting with the Jellyfish API:

#### General

- `get_api_schema` - Retrieves the complete API schema with all available endpoints
- `list_endpoints` - Lists all available API endpoints with their descriptions
- `get_endpoint` - Makes GET requests to any available API endpoint

#### Allocations

- `allocations_by_person`
- `allocations_by_team`
- `allocations_by_investment_category`
- `allocations_by_investment_category_person`
- `allocations_by_investment_category_team`
- `allocations_by_work_category`
- `allocations_by_work_category_person`
- `allocations_by_work_category_team`
- `allocations_filter_fields`
- `allocations_summary_by_investment_category`
- `allocations_summary_by_work_category`

#### Delivery

- `deliverable_details`
- `deliverable_scope_and_effort_history`
- `work_categories`
- `work_category_contents`

#### Metrics

- `company_metrics`
- `person_metrics`
- `team_metrics`
- `team_sprint_summary`
- `unlinked_pull_requests`

#### People

- `list_engineers`
- `search_people`

#### Teams

- `list_teams`
- `search_teams`

Each tool corresponds to a specific Jellyfish API endpoint and allows you to retrieve or search for data as described in the API.

## Setup

### Jellyfish Setup

1. Generate an API token from your Jellyfish instance
   - Go to the [Data Connections page](https://app.jellyfish.co/settings/data-connections/connections)
   - Click the API Export tab
   - Click Generate New Token
   - In the Generate New Token dialog, select a Time To Live value and click Generate. A new token is created and displayed in the dialog
   - Copy the token (you will add it to your host application's config below)
   - Close the dialog

### Local Setup

1. Clone this repository:
```bash
git clone [repository-url]
cd jellyfish-mcp
```

2. Install uv if you haven't already:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

3. Restart your terminal or open a new terminal window to ensure uv is in your PATH.

4. Create a virtual environment and install dependencies:
```bash
uv venv
source .venv/bin/activate
uv pip install .
```

## Usage

### Setup credentials

`jellyfish-mcp` supports two different modes for setting the Jellyfish Export API token.

1. The preferred method is to use `keyring`, which comes with `jellyfish-mcp`. It is
   the most secure and ensures credentials are stored using your operating system's
   preferred credential store. Set your token on your system by running the following in your shell:

```bash
uv run python -m keyring set jellyfish api_token
```

You will then be prompted to set a password. Paste in your API token from Jellyfish and you're good to go.
You won't need to do this again.

2. The other option uses environment variables. If you set `JELLYFISH_API_TOKEN` it will be used as the credential. Many MCP clients allow passing through environment variables, so refer to your tool's documentation for best practices. *In general this is less secure, and isn't recommended.*

### Configuration with VSCode + Copilot

1. Open the "Command Palette..."
2. Search for "MCP: Add Server..." and click it
3. In the dialog box that appears provide: `</FULL/PATH/TO/u> --directory </ABSOLUTE/PATH/TO/jellyfish-mcp> run server.py`
4. Give the MCP server a name
5. Same as part of your user or workspace settings as appropriate.
6. Restart VSCode

#### Running the Server

When you open VSCode from then on, bringing up the "Chat" window should and turning on "Agent" mode should indicate that many tools have been installed from your MCP server. You can then ask Copilot various questions like:

- "What endpoints are available in the Jellyfish API?"
- "Can you get a list of my organization's teams?"
- "Show me the API schema"

### Configuration with Claude Desktop

1. Create or edit your Claude Desktop configuration file at:
   - MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%AppData%\Claude\claude_desktop_config.json`

2. Find your uv installation path by running:
```bash
which uv
```

3. Add the following configuration (replace paths with your values):
```json
{
  "mcpServers": {
    "jellyfish": {
      "command": "/FULL/PATH/TO/uv",
      "args": [
        "--directory",
        "/ABSOLUTE/PATH/TO/jellyfish-mcp",
        "run",
        "server.py"
      ]
    }
  }
}
```

4. Quit and restart Claude Desktop for the configuration changes to take effect.

#### Running the Server

The server will start automatically when you open Claude Desktop with the proper configuration. You can then ask Claude questions about your Jellyfish data, such as:
- "What endpoints are available in the Jellyfish API?"
- "Can you get a list of my organization's teams?"
- "Show me the API schema"

## Troubleshooting

If you encounter issues:

1. Check Claude Desktop logs:
```bash
tail -n 20 -f ~/Library/Logs/Claude/mcp*.log
```

2. Verify your API token is correct and has the necessary permissions
3. Ensure your Jellyfish instance is accessible from your machine
4. Check that the paths in your Claude Desktop config are absolute and correct

## License

This code is distributed under the MIT license. See: LICENSE.
