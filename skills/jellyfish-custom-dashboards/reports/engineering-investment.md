# Engineering Investment Dashboard

A visual snapshot of an organization's major deliverables — FTE investment, progress, status, and projected completion dates. Gives engineering leaders a quick view of where investment is going.

---

## 1. Ask the user which work category to use

Every organization tracks top-level deliverables under different Jellyfish work categories (Initiatives, Themes, Projects, etc.).

```
mcp__jellyfish-mcp__work_categories()
```

Present the options by `display_name` and wait for the user to choose. Highlight likely candidates (Initiative, Theme, Project, Roadmap Project, etc.) but show the full list.

## 2. Fetch deliverable data

```
mcp__jellyfish-mcp__work_category_contents(
  work_category_slug: "<slug>",
  format: "json"
)
```

## 3. Filter and compute

**Filter to active deliverables only.** Include where `source_issue_status` is: "In Progress", "Selected for Development", "Backlog", "In Review". Exclude "Done", "Won't Do", or other completed/cancelled statuses. Exclude `archived` or `deleted` items.

**Per deliverable, extract:**

| Dashboard field | Source | Notes |
|---|---|---|
| Name | `name` | |
| URL | `source_issue_url` | Link the name to this |
| Status | `source_issue_status` | |
| Lifetime FTE | `cumulative_allocation_person_months` | Round to 1 decimal, display with "mo" unit suffix |
| Remaining FTE | `projected_remaining_effort` | Round to 1 decimal, display with "mo" unit suffix, "N/A" if null |
| Progress % | computed | `lifetime / (lifetime + remaining) * 100`. If remaining is null and lifetime > 0, use 100%. If both 0, use 0% |
| Projected date | `projected_date` | Format as "Mon DD, YYYY", "Not set" if null |
| Team count | `teams` | Split by comma, count |

**Summary totals:**
- Total Deliverables = count of filtered items
- Total Lifetime FTE = sum of `cumulative_allocation_person_months`
- Remaining FTE = sum of `projected_remaining_effort` (null → 0)

**Sort** cards by Lifetime FTE descending (biggest investments first).

## 4. Render the HTML

Read `dashboard-template.html` for the page shell and component CSS classes.

Copy the full template. Fill in the shell placeholders:
- `{{TITLE}}` → "Engineering Investment Dashboard"
- `{{SUBTITLE}}` → the chosen work category's display_name
- `{{DATE}}` → today's date

**Summary bar:** 3 items — Total Deliverables, Total Lifetime FTE (person-months), Remaining FTE (person-months).

**Content area:** Use `.cards-grid` with one `.card` per deliverable. Each card contains:
- `.card-header` with deliverable name (linked to `source_issue_url`) and status `.badge`
- `.metrics-row` with Lifetime FTE and Remaining FTE
- `.progress-section` with progress bar
- `.card-footer` with projected date and team count

**Status badge classes:**

| Status | Class |
|---|---|
| In Progress | `badge-green` |
| Selected for Development | `badge-blue` |
| Backlog | `badge-amber` |
| In Review | `badge-violet` |
| Idle | `badge-amber` |

Write the final HTML directly — do not generate scripts. The output should be a complete, self-contained HTML file.

---

## Markdown fallback

Only when the user explicitly asks. Use a table layout with columns: Deliverable, Status, Lifetime FTE, Remaining FTE, Progress, Projected Date, Teams. Include summary totals above the table.
