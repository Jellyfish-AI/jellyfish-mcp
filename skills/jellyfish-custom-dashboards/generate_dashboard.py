#!/usr/bin/env python3
"""Generate a branded Jellyfish dashboard from work_category_contents data.

This script is the trust boundary for the dashboard skill. It takes the raw
JSON returned by the Jellyfish MCP `work_category_contents` tool and renders a
self-contained HTML file using Jinja2 with autoescaping enabled. Because every
value flows through Jinja2's HTML escaping (and URLs are scheme-validated), no
data from the Jellyfish API can be interpreted as HTML or JavaScript in the
output file. The model never hand-writes HTML.

Usage:
    generate_dashboard.py --data contents.json --subtitle "Initiative" \\
        [--title "Engineering Investment Dashboard"] \\
        [--date "May 29, 2026"] [--output dashboard.html]

`--data` may be a file path or "-" to read JSON from stdin.
"""

import argparse
import datetime
import sys
from pathlib import Path
from urllib.parse import urlparse

import json

from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATE_DIR = Path(__file__).parent / "templates"
REPORT_TEMPLATE = "engineering-investment.html.j2"

# Statuses that count as active work for the investment view.
ACTIVE_STATUSES = {
    "In Progress",
    "Selected for Development",
    "Backlog",
    "In Review",
}

# source_issue_status (or derived status) -> badge CSS class.
STATUS_BADGE_CLASS = {
    "In Progress": "badge-green",
    "Selected for Development": "badge-blue",
    "Backlog": "badge-amber",
    "In Review": "badge-violet",
    "Idle": "badge-amber",
}
DEFAULT_BADGE_CLASS = "badge-violet"

ALLOWED_URL_SCHEMES = {"http", "https"}

# Jinja2 environment with autoescaping ON. This is what guarantees no
# API-derived value can render as live HTML/JS; it lives here so the
# guarantee sits beside the trust-boundary docstring at the top of the file.
_ENV = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(default=True, default_for_string=True),
)


def safe_url(url):
    """Return the URL only if it uses an http(s) scheme, else None.

    Jinja2 autoescaping neutralizes tag/attribute injection but does NOT block
    dangerous URL schemes like `javascript:`, so href values are validated here.
    """
    if not url or not isinstance(url, str):
        return None
    scheme = urlparse(url.strip()).scheme.lower()
    return url.strip() if scheme in ALLOWED_URL_SCHEMES else None


def round1(value):
    """Round a numeric value to one decimal place; None-safe."""
    if value is None:
        return None
    try:
        return round(float(value), 1)
    except (TypeError, ValueError):
        return None


def format_date(raw):
    """Format an ISO date (YYYY-MM-DD) as 'Mon DD, YYYY'; 'Not set' if missing."""
    if not raw:
        return "Not set"
    try:
        return datetime.date.fromisoformat(str(raw)[:10]).strftime("%b %d, %Y")
    except ValueError:
        return "Not set"


def team_count(teams):
    """Count comma-separated team names."""
    if not teams or not isinstance(teams, str):
        return 0
    return sum(1 for t in teams.split(",") if t.strip())


def effective_status(deliverable):
    """Derive the display status. An In-Progress deliverable with no ongoing
    work is surfaced as 'Idle' to match the investment view's semantics."""
    status = deliverable.get("source_issue_status") or "Unknown"
    if status == "In Progress" and deliverable.get("is_work_ongoing") is False:
        return "Idle"
    return status


def extract_deliverables(data):
    """Pull the deliverables list out of the work_category_contents payload.

    The endpoint returns a list of timeframe objects, each with a
    `deliverables` array. Be defensive about the exact shape.
    """
    if isinstance(data, dict):
        if "deliverables" in data:
            return data["deliverables"]
        data = [data]
    if isinstance(data, list):
        out = []
        for entry in data:
            if isinstance(entry, dict) and "deliverables" in entry:
                out.extend(entry["deliverables"])
            elif isinstance(entry, dict) and "name" in entry:
                out.append(entry)
        return out
    return []


def build_cards(deliverables):
    """Filter to active deliverables and compute per-card display fields."""
    cards = []
    for d in deliverables:
        if d.get("archived") or d.get("deleted"):
            continue
        if d.get("source_issue_status") not in ACTIVE_STATUSES:
            continue

        lifetime = round1(d.get("cumulative_allocation_person_months")) or 0.0
        remaining = round1(d.get("projected_remaining_effort"))

        if remaining is None:
            progress = 100 if lifetime > 0 else 0
        elif (lifetime + remaining) > 0:
            progress = round(lifetime / (lifetime + remaining) * 100)
        else:
            progress = 0

        status = effective_status(d)
        cards.append(
            {
                "name": d.get("name") or "Untitled",
                "url": safe_url(d.get("source_issue_url")),
                "status": status,
                "badge_class": STATUS_BADGE_CLASS.get(status, DEFAULT_BADGE_CLASS),
                "lifetime_fte": f"{lifetime:.1f}",
                "remaining_fte": "N/A" if remaining is None else f"{remaining:.1f}",
                "progress": progress,
                "projected_date": format_date(d.get("projected_date")),
                "team_count": team_count(d.get("teams")),
            }
        )

    cards.sort(key=lambda c: float(c["lifetime_fte"]), reverse=True)
    return cards


def build_summary(cards, subtitle):
    """Build the three summary-bar items from the already-filtered cards."""
    total_lifetime = sum(float(c["lifetime_fte"]) for c in cards)
    total_remaining = sum(
        float(c["remaining_fte"]) for c in cards if c["remaining_fte"] != "N/A"
    )
    plural = subtitle if subtitle.endswith("s") else f"{subtitle}s"
    return [
        {"label": f"Active {plural}", "value": str(len(cards)), "desc": None},
        {
            "label": "Lifetime FTE",
            "value": f"{total_lifetime:.1f}",
            "desc": "person-months invested",
        },
        {
            "label": "Remaining FTE",
            "value": f"{total_remaining:.1f}",
            "desc": "person-months projected",
        },
    ]


def render(data, subtitle, title, date):
    deliverables = extract_deliverables(data)
    cards = build_cards(deliverables)
    summary_items = build_summary(cards, subtitle)

    template = _ENV.get_template(REPORT_TEMPLATE)
    return template.render(
        title=title,
        subtitle=subtitle,
        date=date,
        summary_items=summary_items,
        deliverables=cards,
    )


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", required=True, help="Path to work_category_contents JSON, or '-' for stdin")
    parser.add_argument("--subtitle", required=True, help="Work category display name (e.g. 'Initiative')")
    parser.add_argument("--title", default="Engineering Investment Dashboard")
    parser.add_argument("--date", default=datetime.date.today().strftime("%b %d, %Y"))
    parser.add_argument("--output", default="dashboard.html")
    args = parser.parse_args(argv)

    if args.data == "-":
        data = json.load(sys.stdin)
    else:
        with open(args.data, encoding="utf-8") as fh:
            data = json.load(fh)

    html = render(data, args.subtitle, args.title, args.date)
    Path(args.output).write_text(html, encoding="utf-8")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
