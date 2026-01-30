# Jellyfish MCP Server

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Docker Hub](https://img.shields.io/docker/v/jellyfishco/jellyfish-mcp?label=Docker%20Hub)](https://hub.docker.com/r/jellyfishco/jellyfish-mcp)
[![GitHub release](https://img.shields.io/github/v/release/Jellyfish-AI/jellyfish-mcp)](https://github.com/Jellyfish-AI/jellyfish-mcp/releases)

> **Security Notice**: There are known risks and inherent limitations in this implementation. Refer to `SECURITY.md` before using.

## Overview

A Model Context Protocol server for retrieving and analyzing data from Jellyfish's API. This server allows a host (e.g. Claude Desktop or Cursor) to interact with your Jellyfish instance, enabling natural language queries about your engineering metrics, team data, and other information available through the Jellyfish API.

Once you have the Jellyfish MCP connected, you can ask questions about your Jellyfish data, such as:
- "What were our company metrics in December 2025?"
- "Can you get a list of my organization's teams?"
- "What are the unlinked pull requests for the last month?"

### Tools and Resources

The server provides several tools for interacting with the Jellyfish API. Each tool corresponds to a specific Jellyfish API endpoint and allows you to retrieve or search for data as described in the API.

#### General

- `get_api_schema` - Retrieves the complete API schema with all available API endpoints

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

#### DevEx

- `devex_insights_by_team`

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


## Setup - Step 1: Collect API Tokens

### Jellyfish Setup (required): Generate an API token from your Jellyfish instance

1. Go to the [API Export](https://app.jellyfish.co/settings/data-connections/api-export) tab on the Data Connections page.
2. Click Generate New Token.
3. In the Generate New Token dialog, select a Time To Live value and click Generate. A new token is created and displayed in the dialog.
4. Copy the token and paste it when prompted.

### PromptGuard Setup (optional): Generate an API token for prompt injection mitigation
`jellyfish-mcp` supports using Meta's Llama PromptGuard 2 model to reduce the likelihood of prompt injections attacks. To set it up, follow these steps.

1. Create an account on [Hugging Face](https://huggingface.co).
2. Navigate to the [PromptGuard 2 86M model](https://huggingface.co/meta-llama/Llama-Prompt-Guard-2-86M).
3. Accept Meta's terms and request access to Llama models.
4. Wait until you are granted access.
5. Create a Hugging Face API token at [Hugging Face settings](https://huggingface.co/settings/tokens) that is a `fine-grained` token with `Make calls to Inference Providers` permissions.
6. Copy the token and paste it when prompted.


## Setup - Step 2: Connect to Host Applications

There are _three_ different ways to connect to the Jellyfish MCP: A) Claude Desktop Extension, B) Docker, or C) Locally. The easiest and recommended approach is with Claude Desktop using the Desktop Extension. For all other host applications (Claude Code, VSCode, Cursor, etc), you can use either Docker or Local Setup. Docker is recommended since it doesn't require Node.js or managing dependencies. Use the local setup if you want more control or want to modify the source code.

It's important to know about the environment variables since you will need to configure them when setting up the Jellyfish MCP. `JELLYFISH_API_TOKEN` is the only required environment variable. The remaining three are optional and correspond to PromptGuard, which uses Meta's Llama PromptGuard 2 model to help mitigate prompt injection attacks. If you choose not to use PromptGuard, simply remove the environment variables from your `.claude.json`/`mcp.json` file.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `JELLYFISH_API_TOKEN` | Your Jellyfish API token. | Yes | - |
| `HUGGINGFACE_API_TOKEN` | Your Hugging Face API token. If not provided, PromptGuard is disabled and data is always returned. | No | - |
| `MODEL_AVAILABILITY` | Controls behavior when PromptGuard cannot be reached (service unavailable, timeout, or invalid token). Set to `true` to allow data if PromptGuard cannot be reached. Set to `false` to block data until PromptGuard can verify response. | No | `false` |
| `MODEL_TIMEOUT` | How long to wait for the PromptGuard model to respond, in seconds. | No | `10` |


### Installation - Option A: Claude Desktop Extension Setup

1. Download the `jellyfish-mcp.mcpb` extension from the [Releases](https://github.com/Jellyfish-AI/jellyfish-mcp/releases) page by clicking on the file name.
2. Once downloaded, double click the file.
3. If the Claude Desktop application doesn't open automatically, open it manually.
4. Follow the instructions and enter your Jellyfish API token (required) and Hugging Face API token (optional).
5. That's it!


### Installation - Option B: Docker Setup

Docker runs the MCP server in an isolated container, so you don't need to install Node.js or manage dependencies on your machine.

Prerequisites: Docker

#### Claude Code:
1. Run the following command in your terminal:
```bash
claude mcp add --transport stdio jellyfish-mcp -- docker run -i --rm --pull always -e JELLYFISH_API_TOKEN -e HUGGINGFACE_API_TOKEN -e MODEL_AVAILABILITY -e MODEL_TIMEOUT jellyfishco/jellyfish-mcp:latest
```
2. Open the `.claude.json` file that was modified and add the `env` block to the `jellyfish-mcp` entry:
```json
"mcpServers": {
  "jellyfish-mcp": {
    "command": "docker",
    "args": [
      "run", "-i", "--rm",
      "--pull", "always",
      "-e", "JELLYFISH_API_TOKEN",
      "-e", "HUGGINGFACE_API_TOKEN",
      "-e", "MODEL_AVAILABILITY",
      "-e", "MODEL_TIMEOUT",
      "jellyfishco/jellyfish-mcp:latest"
    ],
    "env": {
      "JELLYFISH_API_TOKEN": "your_jellyfish_token",
      "HUGGINGFACE_API_TOKEN": "your_huggingface_token",
      "MODEL_AVAILABILITY": "true_or_false",
      "MODEL_TIMEOUT": "seconds"
    }
  }
}
```
3. Run `claude mcp list` to verify the server is connected.

#### VSCode:
1. Open the _Command Palette..._ (_View_ → _Command Palette..._ on macOS)
2. Search for _MCP: Add Server..._ and press Enter
3. Select _Docker Image_ and press Enter
4. Enter `jellyfishco/jellyfish-mcp` as the image name and press Enter
5. Select _Allow_ and press Enter
6. Enter your Jellyfish API token and press Enter
7. Optionally, enter your Hugging Face API token and press Enter
8. Optionally, enter `true` or `false` for model availability and press Enter
9. Optionally, enter an integer (seconds) for model timeout and press Enter
10. Enter `jellyfish-mcp` as the server ID and press Enter

#### Cursor:
1. Go to _Cursor Settings_ (_Cursor_ → _Settings..._ → _Cursor Settings_ on macOS)
2. Go to _Tools & MCP_ and select _Add Custom MCP_
3. Add the following to `mcp.json`:
```json
{
  "mcpServers": {
    "jellyfish-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "--pull", "always",
        "-e", "JELLYFISH_API_TOKEN",
        "-e", "HUGGINGFACE_API_TOKEN",
        "-e", "MODEL_AVAILABILITY",
        "-e", "MODEL_TIMEOUT",
        "jellyfishco/jellyfish-mcp:latest"
      ],
      "env": {
        "JELLYFISH_API_TOKEN": "your_jellyfish_token",
        "HUGGINGFACE_API_TOKEN": "your_huggingface_token",
        "MODEL_AVAILABILITY": "true_or_false",
        "MODEL_TIMEOUT": "seconds"
      }
    }
  }
}
```

### Installation - Option C: Local Setup

Run the MCP server directly on your machine. Use this if you want more control or want to modify the source code.

Prerequisites: Node.js (v18 or later)

Clone and install:
```bash
git clone https://github.com/Jellyfish-AI/jellyfish-mcp.git
cd jellyfish-mcp
npm install
```

#### Claude Code:
1. Run the following command in your terminal:
```bash
claude mcp add --transport stdio jellyfish-mcp -- node /ABSOLUTE/PATH/TO/jellyfish-mcp/server/index.js
```
2. Open the `.claude.json` file that was modified and add the `env` block to the `jellyfish-mcp` entry:
```json
"mcpServers": {
  "jellyfish-mcp": {
    "type": "stdio",
    "command": "node",
    "args": [
      "/ABSOLUTE/PATH/TO/jellyfish-mcp/server/index.js"
    ],
    "env": {
      "JELLYFISH_API_TOKEN": "your_jellyfish_token",
      "HUGGINGFACE_API_TOKEN": "your_huggingface_token",
      "MODEL_AVAILABILITY": "true_or_false",
      "MODEL_TIMEOUT": "seconds"
    }
  }
}
```
3. Run `claude mcp list` to verify the server is connected.

#### VSCode:
1. Open the _Command Palette..._ (_View_ → _Command Palette..._ on macOS)
2. Search for _MCP: Add Server..._ and press Enter
3. Select _Command (stdio)_
4. Enter `node /ABSOLUTE/PATH/TO/jellyfish-mcp/server/index.js` and press Enter
5. Enter `jellyfish-mcp` as the server name and press Enter
6. Open the generated config file (`.vscode/mcp.json`) and add the `env` block:
```json
{
  "servers": {
    "jellyfish-mcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/jellyfish-mcp/server/index.js"
      ],
      "env": {
        "JELLYFISH_API_TOKEN": "your_jellyfish_token",
        "HUGGINGFACE_API_TOKEN": "your_huggingface_token",
        "MODEL_AVAILABILITY": "true_or_false",
        "MODEL_TIMEOUT": "seconds"
      }
    }
  },
  "inputs": []
}
```

#### Cursor:
1. Go to _Cursor Settings_ (_Cursor_ → _Settings..._ → _Cursor Settings_ on macOS)
2. Go to _Tools & MCP_ and select _Add Custom MCP_
3. Add the following to `mcp.json` (with the appropriate paths):
```json
{
  "mcpServers": {
    "jellyfish-mcp": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/jellyfish-mcp/server/index.js"
      ],
      "env": {
        "JELLYFISH_API_TOKEN": "your_jellyfish_token",
        "HUGGINGFACE_API_TOKEN": "your_huggingface_token",
        "MODEL_AVAILABILITY": "true_or_false",
        "MODEL_TIMEOUT": "seconds"
      }
    }
  }
}
```

## Troubleshooting

If you encounter issues:

1. Verify your API token is correct and has the necessary permissions
2. Ensure your Jellyfish instance is accessible from your machine
3. Check that the paths in your config files are absolute and correct
4. For Docker, ensure Docker is running (`docker info` to check)

## License

This code is distributed under the MIT license. See: LICENSE.
