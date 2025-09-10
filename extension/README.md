# jellyfish-mcp: A Jellyfish MCP Server

> **Security Notice**: There are known risks and inherent limitations in this implementation. Refer to `SECURITY.md` before using.

## Overview

A Model Context Protocol server for retrieving and analyzing data from Jellyfish's API. This server allows Claude Desktop to interact with your Jellyfish instance, enabling natural language queries about your engineering metrics, team data, and other information available through the Jellyfish API.

### Tools

The server provides several tools for interacting with the Jellyfish API. Each tool corresponds to a specific Jellyfish API endpoint and allows you to retrieve or search for data as described in the API.

#### General

- `get_api_schema` - Retrieves the complete API schema with all available endpoints

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

## Setup

### **Jellyfish Setup (required):** Generate an API token from your Jellyfish instance

1. Go to the [API Export](https://app.jellyfish.co/settings/data-connections/api-export) tab on the Data Connections page.
2. Click Generate New Token.
3. In the Generate New Token dialog, select a Time To Live value and click Generate. A new token is created and displayed in the dialog.
4. Copy the token and paste it when prompted.

### **PromptGuard Setup (optional):** Generate an API token for prompt injection mitigation
`jellyfish-mcp` supports using Meta's Llama PromptGuard 2 model to reduce the likelihood of prompt injections attacks. To set it up, follow the following steps.

1. Create an account on [Hugging Face](https://huggingface.co).
2. Navigate to the [PromptGuard 2 86M model](https://huggingface.co/meta-llama/Llama-Prompt-Guard-2-86M).
3. Access Meta's terms and request access to Llama models.
4. Wait until you are granted access.
5. Create a Hugging Face API token at [Hugging Face settings](https://huggingface.co/settings/tokens) that is a 'fine-grained' token with 'Make calls to Inference Providers' permissions.
6. Copy the token and paste it when prompted.

## Extension Setup for Claude Desktop

1. Download the `jellyfish-mcp.dxt` extension located in this repository by selecting the file name and clicking "Download raw file" in the upper right corner.
2. Once downloaded, double click the file.
3. If it does not automatically open Claude Desktop, manually open the application.
4. Follow the instructions on the Claude Desktop application and paste the Jellyfish API token and Hugging Face API Token when prompted.
5. That's it!
6. You can now ask Claude Desktop various questions like:
    1. "What endpoints are available in the Jellyfish API?"
    2. "Can you get a list of my organization's teams?"
    3. "Show me the API schema"

## License

This code is distributed under the MIT license. See: LICENSE.
