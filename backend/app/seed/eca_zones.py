"""Seed ECA zone data."""
import json
from pathlib import Path


def load_eca_zones() -> dict:
    """Load ECA zones GeoJSON data."""
    eca_file = Path(__file__).parent.parent / "data" / "eca_zones.geojson"
    if not eca_file.exists():
        return {"type": "FeatureCollection", "features": []}
    with open(eca_file) as f:
        return json.load(f)
