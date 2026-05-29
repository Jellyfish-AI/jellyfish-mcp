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

Dashboards are rendered by a Python generator (`generate_dashboard.py`) using Jinja2 templates. **You never hand-write the HTML.** You fetch data from the MCP, pass it to the generator, and it produces the file. This keeps Jellyfish data safely escaped — it can never be interpreted as HTML or scripts in the output.

---

## How to use this skill

### 1. Pick the report type

| User says... | Report type | File |
|---|---|---|
| "engineering investment", "investment overview", "initiative dashboard", "deliverable dashboard", "big rocks", "where is FTE going" | **Engineering Investment** | `reports/engineering-investment.md` |

If ambiguous, ask one clarifying question rather than guessing.

### 2. Read the report file

Each report file contains the full workflow: what to ask the user, which MCP tools to call (in order), and how to run the generator. Follow it step by step.

### 3. Run the generator

The report file tells you exactly which command to run. In short: save the raw MCP JSON to a file, then run `generate_dashboard.py` with that file and the work category name. The generator filters, computes, and renders the branded HTML.

Dependencies: the generator needs Jinja2. If it is not already available, install it once with `pip install -r requirements.txt` from the skill directory.

### 4. Present

Keep the chat reply short — name what you built and the one or two findings that matter most. The dashboard has the rest.

---

## Files

- `generate_dashboard.py` — renders a dashboard from `work_category_contents` JSON. The trust boundary: all data is HTML-escaped and URLs are scheme-validated here.
- `templates/base.html.j2` — page shell, brand tokens, and component CSS classes. Report templates extend this.
- `templates/engineering-investment.html.j2` — the Engineering Investment layout.
- `reports/*.md` — per-report workflows.
- `requirements.txt` — Python dependencies.

## Adding a new report

1. Add a `templates/<report>.html.j2` that `{% extends "base.html.j2" %}` and fills the `summary` and `content` blocks using the existing component classes.
2. Add a `reports/<report>.md` describing the workflow.
3. Add the computation for it to `generate_dashboard.py` (or a sibling generator), keeping all data rendering inside Jinja2 with autoescaping on. Never use the `| safe` filter on Jellyfish-derived values.
