#!/usr/bin/env python3
"""Optional Overture 'permanently_closed' cross-check for MakanPoP.

Downloads bounded public Overture Places data via the official Python client,
and stores ONLY point records explicitly marked permanently_closed.
Unknown/not tagged status is NEVER treated as proof a restaurant is operating.
Matching to another provider must use exact normalized name AND short distance.
"""
import json
import math
import pathlib
import subprocess
import tempfile
from collections import defaultdict
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parent.parent
TARGET = ROOT / "public/data/overture"
TILE = 0.18
# Peninsular Malaysia approximate bbox; data from neighbouring countries may
# be present but cannot exclude a TomTom record without exact name/proximity.
BBOX = "99.0,1.0,105.3,7.5"

def main():
    with tempfile.TemporaryDirectory(prefix="makanpop-overture-") as tmp:
        path = pathlib.Path(tmp) / "places.geojsonseq"
        subprocess.run(
            ["overturemaps", "download", "--bbox="+BBOX, "-f", "geojsonseq",
             "--type=place", "-o", str(path)],
            check=True, timeout=900
        )
        tiles = defaultdict(list)
        closed = 0
        with path.open(encoding="utf-8") as file:
            for line in file:
                if not line.strip():
                    continue
                try:
                    item = json.loads(line.lstrip("\x1e"))
                except ValueError:
                    continue
                props = item.get("properties") or {}
                if props.get("operating_status") != "permanently_closed":
                    continue
                geometry = item.get("geometry") or {}
                coords = geometry.get("coordinates")
                names = props.get("names") or {}
                name = names.get("primary") if isinstance(names, dict) else None
                if not name or not isinstance(coords, list) or len(coords) < 2:
                    continue
                lon,lat = coords[:2]
                if not isinstance(lon,(int,float)) or not isinstance(lat,(int,float)):
                    continue
                if not (1<=lat<=7.5 and 99<=lon<=105.3):
                    continue
                key = "t{}_{}".format(math.floor(lat/TILE),math.floor(lon/TILE))
                tiles[key].append({
                    "name":str(name)[:200], "lat":round(lat,6), "lon":round(lon,6)
                })
                closed += 1
    if not closed:
        raise RuntimeError("No explicitly closed POIs returned; preserving previous snapshot.")
    TARGET.mkdir(parents=True,exist_ok=True)
    # Rebuild all tiles, removing obsolete tile files only after data succeeded.
    for file in TARGET.glob("t*.json"):
        file.unlink()
    for key,rows in tiles.items():
        (TARGET/(key+".json")).write_text(json.dumps({"closed":rows},separators=(",",":"),ensure_ascii=False),encoding="utf-8")
    manifest={
        "source":"Overture Maps Foundation places",
        "region":"Peninsular Malaysia bounding box (includes some neighbouring areas)",
        "note":"A permanent-closure label is not an independent real-time business verification.",
        "generatedAt":datetime.now(timezone.utc).isoformat(),
        "count":closed,"tiles":sorted(tiles),
        "tileSize":TILE,"attribution":"Overture Maps Foundation and source providers",
        "licenseInfo":"https://docs.overturemaps.org/attribution/"
    }
    (TARGET/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    print("Saved",closed,"explicitly permanently_closed POIs",len(tiles),"small region shards.")

if __name__=="__main__":
    main()
