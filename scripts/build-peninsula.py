#!/usr/bin/env python3
"""Build a free, offline-searchable food POI catalogue for Peninsular Malaysia.

Sources: Geofabrik's OpenStreetMap extract (ODbL) and geoBoundaries state polygons
(CC BY 4.0). Includes only ACTUALLY MAPPED food POIs, not invented restaurants.
"""
import json
import math
import os
import pathlib
import shutil
import sys
import tempfile
import time
from collections import defaultdict
from datetime import datetime, timezone

import osmium
import requests
from shapely.geometry import Point, shape
from shapely.ops import unary_union
from shapely.prepared import prep

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public/data/peninsula"
PBF_URL = "https://download.geofabrik.de/asia/malaysia-singapore-brunei-latest.osm.pbf"
BOUNDARY_URL = "https://www.geoboundaries.org/api/current/gbOpen/MYS/ADM1/"
TILE = 0.18
AMENITIES = {"restaurant", "cafe", "fast_food", "food_court", "ice_cream"}
FOOD_SHOPS = {"bakery", "confectionery", "pastry", "coffee", "tea", "deli"}
PLACE_TAGS = {"city", "town", "village", "suburb", "quarter", "neighbourhood", "hamlet"}
FIELDS = [
    "name", "name:en", "name:ms", "name:zh", "amenity", "shop", "cuisine",
    "brand", "operator", "description", "website", "opening_hours",
    "addr:housenumber", "addr:street", "addr:city", "addr:suburb",
    "addr:place", "addr:unit", "level", "level:ref", "indoor",
    "building", "takeaway", "diet:vegetarian", "diet:vegan",
    "image", "wikimedia_commons", "wikidata", "website",
    "disused", "abandoned", "demolished", "removed", "construction",
    "end_date", "status", "operational_status", "business_status",
    "disused:amenity", "abandoned:amenity", "closed:amenity",
    "removed:amenity", "was:amenity", "shop",
]
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "MakanPoP-WestMalaysia-OSM-Extract/1.0 (https://github.com/chongwenyin006-ux/makanpop-site)"})

def json_get(url, timeout=60):
    error = None
    for i in range(3):
        try:
            response = SESSION.get(url, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except Exception as ex:
            error = ex
            print("Could not read", url, "attempt", i + 1, str(ex), flush=True)
            time.sleep(2 + i * 3)
    raise RuntimeError(f"External data unavailable: {error}")

def get_west_polygon():
    meta = json_get(BOUNDARY_URL)
    url = meta.get("simplifiedGeometryGeoJSON") or meta.get("gjDownloadURL")
    if not url:
        raise RuntimeError("geoBoundaries did not provide an administrative boundary URL")
    fc = json_get(url, 90)
    if fc.get("type") == "Feature":
        features = [fc]
    elif fc.get("type") == "FeatureCollection":
        features = fc["features"]
    else:
        raise RuntimeError("Unexpected state boundary geometry")
    pieces = []
    for feature in features:
        geo = shape(feature["geometry"])
        # Excludes all of East Malaysia and Labuan; do not confuse it with the
        # Peninsular Malaysia national bounding box (which also includes Singapore).
        if geo.centroid.x < 105.2:
            pieces.append(geo)
    if len(pieces) < 9:
        raise RuntimeError(f"Only {len(pieces)} peninsular states found; refusing unsafe geographic fallback")
    union = unary_union(pieces)
    print("Identified", len(pieces), "Peninsular Malaysian administrative regions", flush=True)
    return prep(union)

def download_file(url, target):
    with SESSION.get(url, stream=True, timeout=(30, 120)) as r:
        r.raise_for_status()
        expected = int(r.headers.get("content-length") or 0)
        if expected > 600_000_000:
            raise RuntimeError("Unexpectedly large map extract")
        with open(target, "wb") as dest:
            for chunk in r.iter_content(1024 * 1024):
                if chunk:
                    dest.write(chunk)
    size = os.path.getsize(target)
    if size < 20_000_000:
        raise RuntimeError(f"Unexpectedly small map extract: {size} bytes")
    print("Downloaded", round(size / (1024 * 1024)), "MiB of public map data", flush=True)

def is_confirmed_closed(tags):
    """Exclude only features that source tags describe as inactive; no live-status guarantee."""
    inactive = {"yes", "true", "1"}
    for key in ("disused", "abandoned", "demolished", "removed"):
        if str(tags.get(key, "")).casefold() in inactive:
            return True
    if str(tags.get("shop", "")).casefold() in {"vacant", "disused", "closed"}:
        return True
    if str(tags.get("amenity", "")).casefold() in {"disused", "abandoned", "vacant"}:
        return True
    for key in ("business_status", "operational_status", "status"):
        if str(tags.get(key, "")).casefold() in {
            "permanently_closed", "closed_permanently", "out_of_business",
            "defunct", "shut_down", "disused", "abandoned", "closed",
        }:
            return True
    for key in ("disused:amenity", "abandoned:amenity", "closed:amenity",
                "demolished:amenity", "removed:amenity", "was:amenity",
                "construction:amenity", "proposed:amenity"):
        if tags.get(key):
            return True
    if str(tags.get("opening_hours", "")).strip().casefold() in {
        "closed", "off", "permanently closed",
    }:
        return True
    # Opening hours such as "Mo off" do not imply the business has closed.
    return False


class FoodPlaces(osmium.SimpleHandler):
    def __init__(self, boundary):
        super().__init__()
        self.boundary = boundary
        self.grid = defaultdict(list)
        self.index = []
        self.count = 0
        self.malls = 0
        self.names_seen = set()
        self.photo_linked = 0

    def save(self, obj, kind, lat, lon):
        if not (-90 < lat < 90 and -180 < lon < 180):
            return
        if not (1 < lat < 7.5 and 99 < lon < 105.3):
            return
        if not self.boundary.covers(Point(lon, lat)):
            return
        tags = obj.tags
        name = tags.get("name") or tags.get("name:en") or tags.get("name:ms") or tags.get("name:zh")
        if not name:
            return
        amenity, shop = tags.get("amenity"), tags.get("shop")
        is_food = amenity in AMENITIES or shop in FOOD_SHOPS
        if is_food and is_confirmed_closed(tags):
            is_food = False
        is_mall = shop == "mall" or tags.get("building") == "mall" or amenity == "shopping_mall"
        is_locality = tags.get("place") in PLACE_TAGS
        if is_food:
            properties = {field: tags.get(field) for field in FIELDS if tags.get(field)}
            if "name" not in properties:
                properties["name"] = name
            entry = {
                "type": kind,
                "id": int(obj.id),
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "tags": properties,
            }
            index_key = f"{kind}:{obj.id}"
            if index_key not in self.names_seen:
                self.names_seen.add(index_key)
                cell = f"t{math.floor(lat / TILE)}_{math.floor(lon / TILE)}"
                self.grid[cell].append(entry)
                self.count += 1
                if str(tags.get('wikimedia_commons', '')).startswith('File:') or 'commons.wikimedia.org/wiki/File:' in str(tags.get('image', '')):
                    self.photo_linked += 1
        if is_mall or is_locality:
            # Searchable mall/city/suburb suggestions from real map locations.
            self.index.append({
                "name": str(name)[:130],
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "kind": "mall" if is_mall else str(tags.get("place")),
                "city": str(tags.get("addr:city") or tags.get("addr:suburb") or "")[:65],
            })
            if is_mall:
                self.malls += 1

    def node(self, node):
        tags = node.tags
        if not (tags.get("name") or tags.get("name:en") or tags.get("name:ms") or tags.get("name:zh")):
            return
        if node.location.valid():
            self.save(node, "node", node.location.lat, node.location.lon)

    def way(self, way):
        tags = way.tags
        if not (tags.get("name") or tags.get("name:en") or tags.get("name:ms") or tags.get("name:zh")):
            return
        if not (tags.get("amenity") in AMENITIES or tags.get("shop") in FOOD_SHOPS or
                tags.get("shop") == "mall" or tags.get("building") == "mall" or
                tags.get("place") in PLACE_TAGS):
            return
        try:
            coords = [(n.location.lat, n.location.lon)
                      for n in way.nodes if n.location.valid()]
            if coords:
                lat = sum(x[0] for x in coords) / len(coords)
                lon = sum(x[1] for x in coords) / len(coords)
                self.save(way, "way", lat, lon)
        except (ValueError, RuntimeError):
            pass

def main():
    boundary = get_west_polygon()
    with tempfile.TemporaryDirectory() as temp:
        pbf = os.path.join(temp, "west-source.osm.pbf")
        download_file(PBF_URL, pbf)
        collector = FoodPlaces(boundary)
        collector.apply_file(pbf, locations=True, idx="flex_mem")
    if collector.count < 3000:
        raise RuntimeError(f"Only {collector.count} mapped food places; refusing partial or empty publish")
    generated_at = datetime.now(timezone.utc).isoformat()
    # Atomic directory replace only after successful processing.
    staging = ROOT / "public/data/peninsula-new"
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)
    for tile, elements in collector.grid.items():
        path = staging / (tile + ".json")
        path.write_text(json.dumps({"elements": elements}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    unique = {}
    for item in collector.index:
        key = (item["name"].casefold(), item["kind"], round(item["lat"], 3), round(item["lon"], 3))
        unique[key] = item
    places = sorted(unique.values(), key=lambda x: (x["kind"] != "mall", x["name"].casefold()))
    (staging / "places.json").write_text(json.dumps({"places": places}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    manifest = {
        "region": "Peninsular Malaysia (excluding Sabah, Sarawak and Labuan)",
        "source": "OpenStreetMap via Geofabrik",
        "license": "ODbL-1.0",
        "attribution": "© OpenStreetMap contributors",
        "boundarySource": "geoBoundaries gbOpen, CC BY 4.0",
        "generatedAt": generated_at,
        "tileSize": TILE,
        "tiles": sorted(collector.grid.keys()),
        "count": collector.count,
        "placeNames": len(places),
        "malls": collector.malls,
        "directWikimediaPhotoLinks": collector.photo_linked,
        "closureRule": "Excludes places explicitly tagged inactive/closed; untagged permanent closures can remain",
        "includesIndoor": "Only establishments explicitly mapped in OpenStreetMap",
    }
    (staging / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    staging.rename(OUTPUT)
    print("Published", collector.count, "mapped food locations over", len(collector.grid),
          "tiles and", len(places), "named locations, including", collector.malls,
          "mapped malls. No guarantee of all businesses.", flush=True)

if __name__ == "__main__":
    main()
