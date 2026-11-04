#!/usr/bin/env python3
"""Cache attributed, town-specific Google News RSS headlines for the Ledger.

Only headline, original publisher attribution, dates and links are reproduced.
The upstream Google News RSS endpoint can change or occasionally be unavailable.
"""
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "local-feeds.json"
TOWNS = {
    "newtown": "Newtown",
    "monroe": "Monroe",
    "brookfield": "Brookfield",
    "southbury": "Southbury",
}
MAX_AGE = timedelta(days=45)


def feed_url(name):
    query = quote(f'"{name}" Connecticut when:30d')
    return f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US%3Aen"


def fetch_town(name):
    url = feed_url(name)
    request = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; HousatonicLedgerRSS/1.0)"
    })
    with urlopen(request, timeout=22) as response:
        data = response.read(3_000_000)
    root = ET.fromstring(data)
    cutoff = datetime.now(timezone.utc) - MAX_AGE
    results = []
    seen = set()
    for entry in root.findall("./channel/item"):
        title = (entry.findtext("title") or "").strip()
        link = (entry.findtext("link") or "").strip()
        publisher = (entry.findtext("source") or "").strip() or "External reporting"
        date_text = (entry.findtext("pubDate") or "").strip()
        if not title or urlsplit(link).scheme != "https" or link in seen:
            continue
        pubdate = None
        if date_text:
            try:
                pubdate = parsedate_to_datetime(date_text)
                if pubdate.tzinfo is None:
                    pubdate = pubdate.replace(tzinfo=timezone.utc)
                pubdate = pubdate.astimezone(timezone.utc)
                if pubdate < cutoff:
                    continue
            except (ValueError, TypeError, IndexError):
                pubdate = None
        # News results commonly append the publisher to the headline.
        suffix = " - " + publisher
        if title.endswith(suffix):
            title = title[:-len(suffix)].rstrip()
        results.append({
            "title": title[:220],
            "url": link,
            "source": publisher[:90],
            "published_at": pubdate.isoformat() if pubdate else None,
        })
        seen.add(link)
        if len(results) >= 4:
            break
    return results


def main():
    try:
        old = json.loads(DEST.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        old = {}
    old_towns = old.get("towns", {}) if isinstance(old, dict) else {}
    now = datetime.now(timezone.utc)
    items = {}
    successful = 0
    for key, name in TOWNS.items():
        previous = old_towns.get(key, {}) if isinstance(old_towns, dict) else {}
        try:
            entries = fetch_town(name)
            successful += 1
        except (OSError, ValueError, ET.ParseError) as exc:
            print(f"Feed for {name} unavailable: {exc}")
            entries = previous.get("items", []) if isinstance(previous, dict) else []
            # Only retain reasonably recent previous headlines.
            entries = [i for i in entries if isinstance(i, dict) and (
                not i.get("published_at") or (
                    datetime.fromisoformat(i["published_at"]) >= now - MAX_AGE
                )
            )][:4]
        items[key] = {
            "name": name,
            "feed": feed_url(name),
            "items": entries,
        }

    if not successful:
        print("No town feed could be refreshed; preserving previous cache.")
        return

    payload = {"updated_at": now.isoformat(), "towns": items}
    DEST.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Updated", successful, "town feeds;", sum(len(t["items"]) for t in items.values()), "headlines.")


if __name__ == "__main__":
    main()
