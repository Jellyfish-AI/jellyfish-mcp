# Installing Jellyfish MCP

This guide is for users who want to use the Jellyfish MCP. If you want to modify the source code - see [DEVELOPMENT.md](DEVELOPMENT.md).

> **Security Notice**: There are known risks and inherent limitations in this implementation. Refer to [`SECURITY.md`](SECURITY.md) before using.

## Setup essentials

### Obtain a Jellyfish API token (required)

Generate an API token from your Jellyfish instance. Requires the Admin User Role.

1. Go to the [API Export](https://app.jellyfish.co/settings/data-connections/api-export) tab on the Data Connections page.
2. Click **Generate New Token**.
3. In the dialog, select a Time To Live value and click **Generate**.
4. Copy the token.

### Obtain a Hugging Face token for PromptGuard (optional)
> [!IMPORTANT]
> `jellyfish-mcp` supports using Meta's Llama PromptGuard 2 model to reduce the likelihood of prompt injections attacks. It is **off by default**, but we recommend configuring it before using `jellyfish-mcp` daily — see [PROMPTGUARD.md](PROMPTGUARD.md) for setup and [SECURITY.md](SECURITY.md).

### Configuration variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `JELLYFISH_API_TOKEN` | Your Jellyfish API token. | Yes | — |
| `HUGGINGFACE_API_TOKEN` | Your Hugging Face token. PromptGuard is enabled when this is set. | No | — |
| `MODEL_AVAILABILITY` | Behavior when PromptGuard can't be reached. `true` allows data through (fail-open). `false` blocks data until PromptGuard responds (fail-closed). | No | `false` |
| `MODEL_TIMEOUT` | Seconds to wait for a PromptGuard response. | No | `10` |

If `HUGGINGFACE_API_TOKEN` isn't set, PromptGuard is disabled and data is always returned without scanning.

## Install for your AI client

Pick the section that matches the client you're using.

- [Claude Desktop](#claude-desktop) — one-click extension
- [Claude Code](#claude-code) — npx or Docker
- [Cursor](#cursor) — npx or Docker
- [VSCode](#vscode) — npx or Docker

> **npx or Docker?** Use npx unless you specifically prefer Docker — it's smaller, faster, and the config is shorter. Pick Docker if you already use it for tooling, your environment can't install Node.js, or you want container isolation. To run from a local clone instead, see [DEVELOPMENT.md](DEVELOPMENT.md).

### Claude Desktop

Use the prebuilt extension. No command line required.

1. Download `jellyfish-mcp.mcpb` from the [Releases](https://github.com/Jellyfish-AI/jellyfish-mcp/releases) page.
2. Double-click the downloaded file. Claude Desktop will open if it isn't already.
3. Follow the prompts to enter your Jellyfish API token (and optionally your Hugging Face token).

That's it.

### Claude Code

**npx** — requires Node.js v18 or later.

```bash
claude mcp add jellyfish-mcp \
  -e JELLYFISH_API_TOKEN=your_jellyfish_token \
  -e HUGGINGFACE_API_TOKEN=your_huggingface_token \
  -e MODEL_AVAILABILITY=false \
  -e MODEL_TIMEOUT=10 \
  -- npx -y jellyfish-mcp-server
```

Run `claude mcp list` to verify.

**Docker** — requires Docker installed and running.

```bash
claude mcp add jellyfish-mcp \
  -e JELLYFISH_API_TOKEN=your_jellyfish_token \
  -e HUGGINGFACE_API_TOKEN=your_huggingface_token \
  -e MODEL_AVAILABILITY=false \
  -e MODEL_TIMEOUT=10 \
  -- docker run -i --rm --pull always \
       -e JELLYFISH_API_TOKEN \
       -e HUGGINGFACE_API_TOKEN \
       -e MODEL_AVAILABILITY \
       -e MODEL_TIMEOUT \
       jellyfishco/jellyfish-mcp:latest
```

Run `claude mcp list` to verify.

### Cursor

1. Open _Cursor Settings_ (_Cursor_ → _Settings..._ → _Cursor Settings_ on macOS).
2. Go to _Tools & MCP_ → _Add Custom MCP_.

**npx** — requires Node.js v18 or later. Add to `mcp.json`:

```json
{
  "mcpServers": {
    "jellyfish-mcp": {
      "command": "npx",
      "args": ["-y", "jellyfish-mcp-server"],
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

**Docker** — requires Docker installed and running.

```json
{
  "mcpServers": {
    "jellyfish-mcp": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--pull", "always",
        "-e", "JELLYFISH_API_TOKEN",
        "-e", "HUGGINGFACE_API_TOKEN",
        "-e", "MODEL_AVAILABILITY",
        "-e", "MODEL_TIMEOUT",
        "jellyfishco/jellyfish-mcp:latest"
      ],
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

**npx** — requires Node.js v18 or later.

1. Open the _Command Palette..._ (_View_ → _Command Palette..._ on macOS).
2. Search for _MCP: Add Server..._ and press Enter.
3. Select _Command (stdio)_.
4. Enter `npx -y jellyfish-mcp-server` and press Enter.
5. Enter `jellyfish-mcp` as the server name.
6. Open the generated `.vscode/mcp.json` and add the `env` block:

```json
{
  "servers": {
    "jellyfish-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "jellyfish-mcp-server"],
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

**Docker** — requires Docker installed and running.

1. Open the _Command Palette..._
2. Search for _MCP: Add Server..._ and press Enter.
3. Select _Docker Image_.
4. Enter `jellyfishco/jellyfish-mcp` as the image name.
5. Follow the prompts for each environment variable.
6. Enter `jellyfish-mcp` as the server ID.

## Troubleshooting

- Verify your `JELLYFISH_API_TOKEN` is correct and has the necessary permissions.
- Ensure your Jellyfish instance is reachable from your machine.
- For npx, confirm Node.js v18 or later is installed: `node --version`.
- For Docker, confirm Docker is running: `docker info`.
- If PromptGuard is unexpectedly blocking responses, set `MODEL_AVAILABILITY=true` to allow data through when PromptGuard can't be reached, or unset `HUGGINGFACE_API_TOKEN` to disable PromptGuard entirely.
