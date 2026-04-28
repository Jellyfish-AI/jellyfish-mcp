# Developing Jellyfish MCP

This guide is for contributors who want to run the server from a local clone, modify the source, or run the test suite. If you just want to use the MCP, see [INSTALL.md](INSTALL.md).

> [!IMPORTANT]
> `jellyfish-mcp` supports using Meta's Llama PromptGuard 2 model to reduce the likelihood of prompt injections attacks. It is **off by default**, but we recommend configuring it before using `jellyfish-mcp` daily — see [PROMPTGUARD.md](PROMPTGUARD.md) for setup and [SECURITY.md](SECURITY.md).

## Prerequisites

- Node.js v18 or later
- A Jellyfish API token (see [INSTALL.md](INSTALL.md#obtain-a-jellyfish-api-token-required))

## Clone and install

```bash
git clone https://github.com/Jellyfish-AI/jellyfish-mcp.git
cd jellyfish-mcp
npm install
```

## Run the tests

```bash
npm test
```

## Point an AI client at your local clone

Use the absolute path to `server/index.js` in your local checkout. Refer to the [configuration variables table in INSTALL.md](INSTALL.md#configuration-variables) for what each variable does.

### Claude Code

```bash
claude mcp add --transport stdio jellyfish-mcp -- node /ABSOLUTE/PATH/TO/jellyfish-mcp/server/index.js
```

Then open `.claude.json` and add the `env` block:

```json
"mcpServers": {
  "jellyfish-mcp": {
    "type": "stdio",
    "command": "node",
    "args": ["/ABSOLUTE/PATH/TO/jellyfish-mcp/server/index.js"],
    "env": {
      "JELLYFISH_API_TOKEN": "your_jellyfish_token",
      "HUGGINGFACE_API_TOKEN": "your_huggingface_token",
      "MODEL_AVAILABILITY": "false",
      "MODEL_TIMEOUT": "10"
    }
  }
}
```

### Cursor

In _Cursor Settings_ → _Tools & MCP_ → _Add Custom MCP_, edit `mcp.json`:

```json
{
  "mcpServers": {
    "jellyfish-mcp": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/jellyfish-mcp/server/index.js"],
      "env": {
        "JELLYFISH_API_TOKEN": "your_jellyfish_token",
        "HUGGINGFACE_API_TOKEN": "your_huggingface_token",
        "MODEL_AVAILABILITY": "false",
        "MODEL_TIMEOUT": "10"
      }
    }
  }
}
```

### VSCode

1. Open the _Command Palette..._ → _MCP: Add Server..._ → _Command (stdio)_.
2. Enter `node /ABSOLUTE/PATH/TO/jellyfish-mcp/server/index.js`.
3. Enter `jellyfish-mcp` as the server name.
4. Open the generated `.vscode/mcp.json` and add the `env` block:

```json
{
  "servers": {
    "jellyfish-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/jellyfish-mcp/server/index.js"],
      "env": {
        "JELLYFISH_API_TOKEN": "your_jellyfish_token",
        "HUGGINGFACE_API_TOKEN": "your_huggingface_token",
        "MODEL_AVAILABILITY": "false",
        "MODEL_TIMEOUT": "10"
      }
    }
  },
  "inputs": []
}
```

## Project layout

- `server/` — the MCP server (entry point: `server/index.js`)
- `tests/` — Node test suite
- `manifest.json` — Claude Desktop Extension manifest (DXT)
- `Dockerfile` — Docker image build
- `assets/` — extension icon and screenshots
