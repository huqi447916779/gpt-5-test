#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Fetch & update GPU prices into site/data/prices.json
- Supports: ingest from CSV, simple JSON endpoints, and manual provider scrapers (to be added).
- Intended to run on GitHub Actions daily.
"""
import os, json, csv, sys, time, re
from datetime import datetime, timezone

OUT_PATH = "site/data/prices.json"

# You can place human-curated data here as a baseline.
BASELINE_CSV = os.environ.get("BASELINE_CSV", "baseline_prices.csv")

def now_date():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

def read_baseline_csv(path):
    rows = []
    if not os.path.exists(path): return rows
    with open(path, newline='', encoding='utf-8') as f:
        r = csv.DictReader(f)
        for row in r:
            try:
                row["price_usd_per_hr"] = float(row.get("price_usd_per_hr") or 0)
                row["quantity_gpus"] = int(float(row.get("quantity_gpus") or 0)) or None
            except:
                row["price_usd_per_hr"] = None
                row["quantity_gpus"] = None
            rows.append(row)
    return rows

def normalize(row):
    fields = ["date_observed","provider","region","gpu_model","pricing_type",
              "price_usd_per_hr","quantity_gpus","instance_type","bandwidth_notes",
              "commitment_terms","source_url","notes"]
    out = {k: row.get(k) for k in fields}
    # defaults
    out["date_observed"] = row.get("date_observed") or now_date()
    out["pricing_type"] = row.get("pricing_type") or "on-demand"
    if out.get("price_usd_per_hr") is not None:
        out["price_usd_per_hr"] = float(out["price_usd_per_hr"])
    return out

def fetch_public_sources():
    """
    TODO: Add real fetchers here, e.g.:
      - GPU aggregators (if API available)
      - Cloud providers pricing pages (parse/regex)
      - Community feeds
    For now, returns empty list; baseline CSV drives content.
    """
    return []

def main():
    data = []
    # 1) baseline curated CSV (optional)
    data += read_baseline_csv(BASELINE_CSV)
    # 2) public sources (to be implemented/extended)
    data += fetch_public_sources()

    # 3) normalize and deduplicate to the latest by (provider, region, gpu_model, pricing_type, instance_type)
    norm = [normalize(r) for r in data if r]
    norm = [r for r in norm if r.get("provider") and r.get("gpu_model") and r.get("price_usd_per_hr")]
    # dedup key
    latest = {}
    for r in norm:
        key = (r.get("provider"), r.get("region"), r.get("gpu_model"), r.get("pricing_type"), r.get("instance_type"))
        ts = r.get("date_observed") or now_date()
        # keep the newest by date string
        if key not in latest or str(ts) > str(latest[key]["date_observed"]):
            latest[key] = r
    out = list(latest.values())
    # write JSON
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(out)} rows to {OUT_PATH}")

if __name__ == "__main__":
    main()
