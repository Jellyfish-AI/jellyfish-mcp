# Engineering Investment Dashboard

A visual snapshot of an organization's major deliverables — FTE investment, progress, status, and projected completion dates. Gives engineering leaders a quick view of where investment is going.

---

## 1. Determine the work category

Every organization tracks top-level deliverables under different Jellyfish work categories (Initiatives, Themes, Projects, etc.).

**If the user already named a category** (e.g. "show me initiatives", "epics dashboard"), use that term directly in Step 2 — skip this call.

**If the user hasn't specified one**, call:

```
mcp__jellyfish-mcp__work_categories()
```

Present the options by `display_name` and wait for the user to choose. Highlight likely candidates (Initiative, Theme, Project, Roadmap Project, etc.) but show the full list.

## 2. Fetch deliverable data

```
mcp__jellyfish-mcp__search_deliverables(
  work_category: "<chosen category display_name>",
  activity_status: ["in_progress", "idle"],
  limit: 100
)
```

Results are in `response.items`. If `items.length` equals `limit`, results may be truncated — note this to the user.

## 3. Filter and compute

**Filter to active deliverables only.** Exclude any items where `activity_status` is `completed`, `all_complete`, or `jira_resolution`.

**Per deliverable, extract:**

| Dashboard field | Source | Notes |
|---|---|---|
| Name | `name` | |
| URL | `source_issue_url` | Link the name to this |
| Status | `activity_status` | |
| Lifetime FTE | `lifetime_ftes` | Round to 1 decimal, display with "mo" unit suffix |
| Progress % | computed | `(issue_count - unresolved_issue_count) / issue_count * 100`. If `issue_count` is 0, use 0% |
| Issue counts | `issue_count`, `unresolved_issue_count` | Display as "X of Y issues resolved" |
| Target date | `target_date` | Format as "Mon DD, YYYY", "Not set" if null |
| Projected date | `projected_date` | Format as "Mon DD, YYYY", "Not set" if null |
| Last active | `last_work_date` | Format as "Mon DD, YYYY" |
| Team count | `teams` | Count array length |

**Summary totals:**
- Total Deliverables = count of filtered items
- Active = count where `activity_status` is `in_progress`
- Idle = count where `activity_status` is `idle`
- Total Lifetime FTE = sum of `lifetime_ftes`

**Sort** cards by Lifetime FTE descending (biggest investments first).

## 4. Render the HTML

Read `dashboard-template.html` for the page shell and component CSS classes.

Copy the full template. Fill in the shell placeholders:
- `{{TITLE}}` → "Engineering Investment Dashboard"
- `{{SUBTITLE}}` → the chosen work category's display_name
- `{{DATE}}` → today's date

**Summary bar:** 4 items — Total Deliverables, Active count, Idle count, Total Lifetime FTE (person-months).

**Content area:** Use `.cards-grid` with one `.card` per deliverable. Each card contains:
- `.card-header` with deliverable name (linked to `source_issue_url`) and status `.badge`
- `.metrics-row` with Lifetime FTE, issue counts ("X of Y issues resolved"), and team count
- `.progress-section` with progress bar
- `.card-footer` with target date, projected date, and last active date

**Status badge classes:**

| Status | Class |
|---|---|
| in_progress | `badge-green` |
| idle | `badge-amber` |
| n_a | `badge-blue` |

Write the final HTML directly — do not generate scripts. The output should be a complete, self-contained HTML file.

---

## Markdown fallback

Only when the user explicitly asks. Use a table layout with columns: Deliverable, Status, Lifetime FTE, Progress, Issues Resolved, Target Date, Projected Date, Last Active, Teams. Include summary totals above the table.
