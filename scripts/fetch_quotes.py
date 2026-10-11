"""Fetch index quotes the browser can't reach directly and write data/quotes.json.

Runs on a GitHub Actions schedule (see .github/workflows/quotes.yml). Browsers can't
call Yahoo's endpoint (no CORS headers), so GitHub does it server-side and commits a
small JSON file the site reads. Python stdlib only, so the Action needs no installs.
Pine Script equivalent: none. In MQL5 you'd use WebRequest() from an EA for the same job.
"""
import json, time, urllib.request
from datetime import datetime, timezone

SYMBOLS = {"US30": "%5EDJI", "NAS100": "%5ENDX"}   # Dow Jones, Nasdaq 100
UA = {"User-Agent": "Mozilla/5.0 (quotes bot for fortunesfx.com)"}

def quote(yahoo_symbol):
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{yahoo_symbol}?range=1d&interval=1d"
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
        meta = json.load(r)["chart"]["result"][0]["meta"]
    price, prev = meta["regularMarketPrice"], meta.get("chartPreviousClose") or meta.get("previousClose")
    change = (price / prev - 1) * 100 if prev else 0.0
    return {"p": round(price, 2), "c": round(change, 2)}

out = {"updated": datetime.now(timezone.utc).isoformat(timespec="seconds")}
for name, sym in SYMBOLS.items():
    try:
        out[name] = quote(sym)
    except Exception as e:  # keep the last good value by leaving the key out
        print(f"{name}: {e}")
    time.sleep(1)  # be polite

json.dump(out, open("data/quotes.json", "w"), indent=1)
print(json.dumps(out))
