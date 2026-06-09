---
name: jellyfish-custom-dashboards
description: Build branded dashboards and reports from Jellyfish engineering analytics. Use this skill whenever the user asks for a dashboard, report, or visual summary involving Jellyfish data. Also use for diagnostic questions like "where is effort going", "how are we tracking", or "show me the data". Currently supports: engineering investment.
metadata:
  author: Jellyfish
  version: 1.0.0
  mcp-server: jellyfish-mcp
---

# Jellyfish Custom Dashboards

Generate professional, branded HTML dashboards from Jellyfish engineering analytics. Markdown is the fallback only when the user explicitly asks for it.

---

## How to use this skill

### 1. Pick the report type

| User says... | Report type | File |
|---|---|---|
| "engineering investment", "investment overview", "initiative dashboard", "deliverable dashboard", "big rocks", "where is FTE going" | **Engineering Investment** | `reports/engineering-investment.md` |

If ambiguous, ask one clarifying question rather than guessing.

### 2. Read the report file

Each report file contains the full workflow: what to ask the user, which MCP tools to call (in order), how to interpret the data, and how to render the output. Follow it step by step.

### 3. Apply the brand

Read `dashboard-template.html` for the page shell, component CSS classes, and brand tokens. Don't substitute generic themes.

### 4. Present

Keep the chat reply short — name what you built and the one or two findings that matter most. The dashboard has the rest.
