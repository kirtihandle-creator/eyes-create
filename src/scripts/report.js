"""Generate a usage report from shortie's links.json.

Usage:
    python report.py [path/to/links.json] [--top N]

Prints total links, total hits, the most-visited links, and a breakdown of
links by destination host.
"""

import json
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse


DEFAULT_FILE = Path(__file__).resolve().parents[2] / "data" / "links.json"


def load_links(path: Path) -> dict:
    """Read the links file, returning an empty dict if it does not exist."""
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def top_links(links: dict, n: int) -> list[tuple[str, dict]]:
    """Return the n links with the most hits, highest first."""
    return sorted(links.items(), key=lambda item: item[1].get("hits", 0), reverse=True)[:n]


def hosts_breakdown(links: dict) -> Counter:
    """Count how many links point at each destination host."""
    counter: Counter = Counter()
    for record in links.values():
        host = urlparse(record.get("url", "")).hostname or "unknown"
        counter[host] += 1
    return counter


def oldest_link(links: dict) -> tuple[str, dict] | None:
    """Return the link with the earliest createdAt timestamp."""
    dated = [
        (code, record)
        for code, record in links.items()
        if record.get("createdAt")
    ]
    if not dated:
        return None
    return min(dated, key=lambda item: datetime.fromisoformat(item[1]["createdAt"].replace("Z", "+00:00")))


def format_report(links: dict, top_n: int) -> str:
    total_hits = sum(record.get("hits", 0) for record in links.values())
    lines = [
        "shortie usage report",
        "=" * 20,
        f"Links:       {len(links)}",
        f"Total hits:  {total_hits}",
        "",
    ]

    oldest = oldest_link(links)
    if oldest:
        code, record = oldest
        lines.append(f"Oldest link: {code} ({record['createdAt']})")
        lines.append("")

    lines.append(f"Top {top_n} links by hits:")
    for code, record in top_links(links, top_n):
        lines.append(f"  {code:<8} {record.get('hits', 0):>6}  {record.get('url', '')}")
    lines.append("")

    lines.append("Links by host:")
    for host, count in hosts_breakdown(links).most_common():
        lines.append(f"  {host:<30} {count}")

    return "\n".join(lines)


def parse_args(argv: list[str]) -> tuple[Path, int]:
    path = DEFAULT_FILE
    top_n = 5
    args = iter(argv)
    for arg in args:
        if arg == "--top":
            try:
                top_n = max(1, int(next(args)))
            except (StopIteration, ValueError):
                sys.exit("--top requires a positive integer")
        else:
            path = Path(arg)
    return path, top_n


def main(argv: list[str]) -> int:
    path, top_n = parse_args(argv)
    links = load_links(path)
    if not links:
        print(f"No links found in {path}")
        return 0
    print(format_report(links, top_n))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
