#!/usr/bin/env python3
"""Update headline-only RSS aggregation for the fictional Ledger website.

The external articles are owned by their publishers; this file saves only
titles, link URLs, byline source identifiers and refresh time.
"""
from datetime import datetime, timezone
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "feeds.json"
SOURCES = (
    ("NPR", "https://feeds.npr.org/1001/rss.xml"),
    ("BBC News", "https://feeds.bbci.co.uk/news/rss.xml"),
)

def fetch(source_name, url):
    req = Request(url, headers={"User-Agent":"HousatonicLedger-RSSReader/1.0 (+GitHub Pages; public news feed)"})
    with urlopen(req, timeout=18) as response:
        xml = response.read(2_000_000)
    root = ET.fromstring(xml)
    stories = []
    for item in root.findall(".//channel/item")[:9]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        if not title or urlsplit(link).scheme != "https":
            continue
        stories.append({"source":source_name,"title":title[:180],"url":link})
        if len(stories) >= 3:
            break
    return stories

def main():
    entries = []
    failures = []
    for source, url in SOURCES:
        try:
            results = fetch(source, url)
            if not results:
                raise ValueError("Feed was empty")
            entries.extend(results)
        except Exception as exc:
            failures.append(f"{source}: {exc}")
    # Never replace previously populated cache with empty headlines.
    if not entries:
        print("RSS unavailable; keeping existing cache. " + "; ".join(failures))
        return
    old = {}
    try:
        old = json.loads(CACHE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        pass
    # Keep the last known links from a publisher when only its feed failed.
    present = {e["source"] for e in entries}
    for previous in old.get("items", []):
        if isinstance(previous, dict) and previous.get("source") not in present:
            entries.append(previous)
    output = {
        "updated_at":datetime.now(timezone.utc).isoformat(),
        "items":entries[:6],
        "sources":[{"name":name,"feed":url} for name,url in SOURCES]
    }
    CACHE.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Saved {len(output['items'])} attributed headlines." + (" Some feeds failed: "+", ".join(failures) if failures else ""))

if __name__ == "__main__":
    main()
