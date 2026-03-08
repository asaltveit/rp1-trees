"""
Vercel Python serverless function — single plant generation.

POST /api/generate
Body: { "description": str, "seed": int? }
Response: { "plants": [{ "glb_b64": str, "species_id": str, "plant_name": str,
                          "x_offset": 0, "z_offset": 0, metadata... }] }
"""

import base64
import json
import logging
import os
import sys
from http.server import BaseHTTPRequestHandler

# Add the plant library to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _generate(description: str, seed: int) -> dict:
    from plant.text_parser import parse_description
    from plant.generator import generate_plant

    params = parse_description(description, seed)
    glb_bytes, metadata = generate_plant(params)
    glb_b64 = base64.b64encode(glb_bytes).decode("utf-8")

    return {
        "glb_b64": glb_b64,
        "x_offset": 0.0,
        "z_offset": 0.0,
        **metadata,
    }


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length else {}

            description = body.get("description", "a medium oak tree")
            seed = int(body.get("seed", 42))

            plant = _generate(description, seed)
            response = json.dumps({"plants": [plant]}).encode("utf-8")
            self._ok(response)
        except Exception as e:
            logger.exception("Generation failed")
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
