"""
Vercel Python serverless function — biome set generation.

POST /api/biome
Body: { "theme": str, "seed": int? }
Response: { "plants": [{ "glb_b64": str, "species_id": str, "plant_name": str,
                          "x_offset": float, "z_offset": float, ... }] }
"""

import base64
import json
import logging
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "plant"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _generate_one(variant: dict, seed: int) -> dict:
    from plant.text_parser import parse_description
    from plant.generator import generate_plant

    description = variant.get("description", "a generic tree")
    params = parse_description(description, seed)
    # Attach plant_name from biome variant
    params["plant_name"] = variant.get("plant_name", params.get("species_id", "Plant"))

    glb_bytes, metadata = generate_plant(params)
    glb_b64 = base64.b64encode(glb_bytes).decode("utf-8")

    return {
        "glb_b64": glb_b64,
        "x_offset": float(variant.get("x_offset", 0.0)),
        "z_offset": float(variant.get("z_offset", 0.0)),
        **metadata,
    }


def _generate_biome(theme: str, seed: int) -> list:
    from plant.text_parser import parse_biome

    variants = parse_biome(theme)
    logger.info(f"Biome '{theme}': {len(variants)} plant variants")

    results = [None] * len(variants)

    # Parallelise with ThreadPoolExecutor (I/O-bound Claude calls overlap)
    with ThreadPoolExecutor(max_workers=min(len(variants), 4)) as pool:
        future_to_idx = {
            pool.submit(_generate_one, variant, seed + i): i
            for i, variant in enumerate(variants)
        }
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                results[idx] = future.result()
            except Exception as e:
                logger.error(f"Plant {idx} failed: {e}")
                results[idx] = {"error": str(e), "x_offset": 0.0, "z_offset": 0.0}

    return [r for r in results if r is not None]


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}

            theme = body.get("theme", "temperate forest")
            seed = int(body.get("seed", 42))

            plants = _generate_biome(theme, seed)
            response = json.dumps({"plants": plants}).encode("utf-8")
            self._ok(response)
        except Exception as e:
            logger.exception("Biome generation failed")
            err = json.dumps({"error": str(e)}).encode("utf-8")
            self._error(500, err)

    def _ok(self, data: bytes):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _error(self, code: int, data: bytes):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format, *args):
        logger.info(format % args)
