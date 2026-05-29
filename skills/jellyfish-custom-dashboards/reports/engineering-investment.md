# Engineering Investment Dashboard

A visual snapshot of an organization's major deliverables — FTE investment, progress, status, and projected completion dates. Gives engineering leaders a quick view of where investment is going.

The dashboard is rendered by `generate_dashboard.py`, which safely escapes all Jellyfish data through Jinja2. **Do not hand-write HTML** — your job is to fetch the data and run the generator.

---

## 1. Ask the user which work category to use

Every organization tracks top-level deliverables under different Jellyfish work categories (Initiatives, Themes, Projects, etc.).

```
mcp__jellyfish-mcp__work_categories()
```

Present the options by `display_name` and wait for the user to choose. Highlight likely candidates (Initiative, Theme, Project, Roadmap Project, etc.) but show the full list. Remember the chosen `display_name` (e.g. "Initiative") and `slug`.

## 2. Fetch deliverable data and save it to a file

```
mcp__jellyfish-mcp__work_category_contents(
  work_category_slug: "<slug>",
  format: "json"
)
```

Write the **raw, unmodified** JSON response to a file, e.g. `contents.json`. Do not summarize, filter, or reshape it — the generator does that. Passing the raw payload through means there is no opportunity to introduce unescaped data by hand.

## 3. Generate the dashboard

Run the generator, pointing it at the saved JSON. Pass the chosen work category `display_name` as `--subtitle`.

```
python generate_dashboard.py \
  --data contents.json \
  --subtitle "Initiative" \
  --output dashboard.html
```

Options:
- `--subtitle` (required) — the work category display name, shown under the title and pluralized in the summary bar ("Active Initiatives").
- `--title` — defaults to "Engineering Investment Dashboard".
- `--date` — defaults to today, formatted "Mon DD, YYYY".
- `--output` — defaults to `dashboard.html`.
- `--data -` — read JSON from stdin instead of a file.

If `jinja2` is not installed, install the skill dependencies first: `pip install -r requirements.txt`.

## 4. Present

Keep the chat reply short — name what you built and the one or two findings that matter most (e.g. the biggest investment, anything idle or off-track). The dashboard has the rest.

---

## What the generator does (for reference)

You don't compute any of this — the script does. Documented here so the output is auditable.

**Filter to active deliverables.** Keeps items whose `source_issue_status` is "In Progress", "Selected for Development", "Backlog", or "In Review". Excludes `archived` and `deleted` items.

**Per deliverable:**

| Dashboard field | Source | Notes |
|---|---|---|
| Name | `name` | Linked to `source_issue_url` |
| URL | `source_issue_url` | Only used if it is an http/https URL (others dropped) |
| Status | `source_issue_status` | An "In Progress" item with `is_work_ongoing: false` is shown as "Idle" |
| Lifetime FTE | `cumulative_allocation_person_months` | 1 decimal, "mo" suffix |
| Remaining FTE | `projected_remaining_effort` | 1 decimal, "mo" suffix, "N/A" if null |
| Progress % | computed | `lifetime / (lifetime + remaining) * 100`; 100% if remaining is null and lifetime > 0; 0% if both 0 |
| Projected date | `projected_date` | "Mon DD, YYYY", "Not set" if null |
| Team count | `teams` | Count of comma-separated names |

**Summary bar:** Active <category>s (count), Lifetime FTE (sum, person-months invested), Remaining FTE (sum, person-months projected).

**Status badge classes:** In Progress → `badge-green`, Selected for Development → `badge-blue`, Backlog → `badge-amber`, In Review → `badge-violet`, Idle → `badge-amber`.

**Sort:** cards by Lifetime FTE descending.

---

## Markdown fallback

Only when the user explicitly asks for markdown instead of a dashboard. Use a table layout with columns: Deliverable, Status, Lifetime FTE, Remaining FTE, Progress, Projected Date, Teams. Include summary totals above the table.
