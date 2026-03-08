"""
Text Description Parser.

Converts a plain-text plant description into a parameter dict
that drives the generation pipeline.

Two strategies, tried in order:
  1. Claude API  — structured JSON extraction via claude-haiku-4-5-20251001
  2. Keyword fallback — pure-Python regex/keyword matching

Extended from fractal-trees-2 to also extract lsystem_rule, lsystem_iterations,
bark_color_hsv, and leaf_color_hsv.
"""

import json
import logging
import os
import re

logger = logging.getLogger(__name__)

KNOWN_SPECIES = [
    "oak", "pine", "birch", "willow", "maple", "palm",
    "generic_deciduous", "generic_conifer",
]

SPECIES_KEYWORDS = {
    "oak":        ["oak", "quercus", "acorn"],
    "pine":       ["pine", "pinus", "spruce", "fir", "conifer", "evergreen", "cedar", "redwood"],
    "birch":      ["birch", "betula", "silver birch", "white birch"],
    "willow":     ["willow", "salix", "weeping willow", "pussy willow"],
    "maple":      ["maple", "acer", "sycamore"],
    "palm":       ["palm", "coconut", "date palm", "tropical"],
    "generic_conifer":   ["conical", "columnar", "christmas tree", "needle"],
    "generic_deciduous": ["tree", "deciduous", "broadleaf", "broad-leaf"],
}

SIZE_KEYWORDS = {
    "tiny": 3.0, "miniature": 3.0, "bonsai": 2.0, "dwarf": 4.0,
    "small": 6.0, "short": 6.0,
    "medium": 10.0, "average": 10.0, "normal": 10.0,
    "tall": 16.0, "large": 14.0, "big": 14.0,
    "giant": 25.0, "massive": 22.0, "huge": 22.0, "towering": 30.0,
}

SHAPE_KEYWORDS = {
    "narrow": 0.20, "columnar": 0.18, "slender": 0.22,
    "normal": 0.35, "round": 0.40, "oval": 0.35,
    "wide": 0.50, "broad": 0.50, "spreading": 0.55,
    "weeping": 0.45, "drooping": 0.45,
}

CURVATURE_KEYWORDS = {
    "straight": 0.0, "upright": 0.0, "vertical": 0.0,
    "slightly curved": 0.5, "gently curved": 0.5, "gentle curve": 0.5,
    "curved": 1.0, "leaning": 1.0, "bent": 1.2,
    "dramatically curved": 2.0, "dramatic": 2.0, "twisted": 1.8,
}

DENSITY_KEYWORDS = {
    "bare": 0.05, "leafless": 0.05, "sparse": 0.4, "thin": 0.5,
    "light": 0.6, "moderate": 0.85,
    "dense": 1.2, "thick": 1.3, "full": 1.3, "lush": 1.4, "very dense": 1.5,
}

ANGLE_KEYWORDS = {
    "horizontal branches": 25.0, "spreading branches": 20.0,
    "upward branches": -15.0, "ascending branches": -10.0,
    "drooping branches": 25.0, "pendulous": 20.0,
    "dramatic branch angles": 20.0, "wide angles": 15.0,
}

# Default colors by species (HSV)
SPECIES_COLORS = {
    "oak":               {"bark": [30, 40, 30], "leaf": [110, 65, 35]},
    "pine":              {"bark": [25, 45, 28], "leaf": [130, 70, 30]},
    "birch":             {"bark": [40, 10, 80], "leaf": [100, 60, 50]},
    "willow":            {"bark": [35, 35, 30], "leaf": [95, 55, 40]},
    "maple":             {"bark": [30, 50, 25], "leaf": [15, 80, 60]},
    "palm":              {"bark": [35, 55, 40], "leaf": [120, 65, 35]},
    "generic_deciduous": {"bark": [30, 40, 30], "leaf": [110, 60, 38]},
    "generic_conifer":   {"bark": [25, 45, 28], "leaf": [130, 68, 30]},
}

_SYSTEM_PROMPT = f"""You are a 3D plant/tree parameter extractor for a procedural L-system generator.

Given a text description of a plant or tree (real or fictional), extract parameters and return ONLY valid JSON.

Valid species_id values: {KNOWN_SPECIES}
Choose the closest match. Use "generic_deciduous" for unknown broadleaf, "generic_conifer" for unknown needle/cone.
For fictional species, choose the closest real-world analogue.

Return ONLY this JSON (no markdown, no explanation):
{{
  "species_id": "<species>",
  "height_m": <float 0.5–40>,
  "canopy_radius_m": <float 0.2–15>,
  "trunk_curvature": <float 0–2, where 0=straight, 2=dramatic>,
  "branch_angle_modifier": <float -30 to +30, degrees added to species default>,
  "leaf_density_modifier": <float 0.05–1.5, multiplied with species default>,
  "size_scale": <float 0.1–3>,
  "bark_color_hsv": [<hue 0-360>, <sat 0-100>, <val 0-100>],
  "leaf_color_hsv": [<hue 0-360>, <sat 0-100>, <val 0-100>],
  "lsystem_rule": "<optional L-system rule string using chars: F+-^v[]>",
  "lsystem_iterations": <int 2–4>
}}

For the lsystem_rule, use characters: F (forward), + (yaw left), - (yaw right), ^ (pitch up), v (pitch down), [ (push), ] (pop).
Examples:
  Dense oak: "F[+F^F][-F^F][^F]"
  Weeping willow: "F[+Fv F][-Fv F][Fv]"
  Columnar pine: "F[+F^F][-F^F]"
  Tropical palm: "F[+F][-F][^F][vF]"

For fictional/alien plants, invent creative rules that match the description.
If unsure about lsystem_rule, use null and it will use the species default.
"""

_BIOME_SYSTEM_PROMPT = """You are a biome plant designer for a 3D procedural plant generator.

Given a biome/world theme description, generate 3–7 diverse plant variants that would populate that environment.
Return ONLY valid JSON array (no markdown):

[
  {{
    "description": "<single plant description>",
    "x_offset": <float metres from scene centre>,
    "z_offset": <float metres from scene centre>,
    "plant_name": "<short evocative name>"
  }},
  ...
]

Guidelines:
- Vary plant types (tall trees, shrubs, ground cover, distinctive specimens)
- Spread x_offset and z_offset between -15 and +15 metres so plants don't overlap
- For fictional biomes, be creative with descriptions
- plant_name should be 1–3 words, evocative
"""


def _match_keyword_dict(text_lower: str, kw_dict: dict, default):
    best_key, best_val = None, default
    for kw, val in kw_dict.items():
        if kw in text_lower:
            if best_key is None or len(kw) > len(best_key):
                best_key, best_val = kw, val
    return best_val


def _extract_explicit_height(text_lower: str):
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:m\b|metre[s]?|meter[s]?)", text_lower)
    if m:
        return float(m.group(1))
    m = re.search(r"(\d+(?:\.\d+)?)\s*(?:ft\b|feet|foot)", text_lower)
    if m:
        return float(m.group(1)) * 0.3048
    return None


def _keyword_fallback(text: str, seed: int) -> dict:
    t = text.lower()

    species_id = "generic_deciduous"
    for sp_id, keywords in SPECIES_KEYWORDS.items():
        if any(kw in t for kw in keywords):
            species_id = sp_id
            break

    height_m = _extract_explicit_height(t) or _match_keyword_dict(t, SIZE_KEYWORDS, 10.0)
    shape_ratio = _match_keyword_dict(t, SHAPE_KEYWORDS, 0.35)
    canopy_radius_m = height_m * shape_ratio
    trunk_curvature = _match_keyword_dict(t, CURVATURE_KEYWORDS, 0.2)
    branch_angle_modifier = _match_keyword_dict(t, ANGLE_KEYWORDS, 0.0)
    leaf_density_modifier = _match_keyword_dict(t, DENSITY_KEYWORDS, 1.0)
    size_scale = height_m / 10.0

    colors = SPECIES_COLORS.get(species_id, SPECIES_COLORS["generic_deciduous"])

    return {
        "species_id": species_id,
        "height_m": height_m,
        "canopy_radius_m": canopy_radius_m,
        "trunk_curvature": trunk_curvature,
        "branch_angle_modifier": branch_angle_modifier,
        "leaf_density_modifier": leaf_density_modifier,
        "size_scale": size_scale,
        "bark_color_hsv": colors["bark"],
        "leaf_color_hsv": colors["leaf"],
        "lsystem_rule": None,
        "lsystem_iterations": 4,
        "seed": seed,
        "parse_method": "keyword",
    }


def parse_description(text: str, seed: int = 42) -> dict:
    """Parse a plant description. Returns a parameter dict."""
    if not text or not text.strip():
        raise ValueError("Description must not be empty")

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if api_key:
        try:
            import anthropic
            client = anthropic.Anthropic()
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=400,
                system=_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": text.strip()}],
            )
            raw = response.content[0].text.strip()
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            data = json.loads(raw)

            species_id = data.get("species_id", "generic_deciduous")
            if species_id not in KNOWN_SPECIES:
                species_id = "generic_deciduous"

            colors = SPECIES_COLORS.get(species_id, SPECIES_COLORS["generic_deciduous"])
            h = float(data.get("height_m", 10.0))

            return {
                "species_id": species_id,
                "height_m": h,
                "canopy_radius_m": float(data.get("canopy_radius_m", h * 0.35)),
                "trunk_curvature": float(data.get("trunk_curvature", 0.3)),
                "branch_angle_modifier": float(data.get("branch_angle_modifier", 0.0)),
                "leaf_density_modifier": float(data.get("leaf_density_modifier", 1.0)),
                "size_scale": float(data.get("size_scale", 1.0)),
                "bark_color_hsv": data.get("bark_color_hsv", colors["bark"]),
                "leaf_color_hsv": data.get("leaf_color_hsv", colors["leaf"]),
                "lsystem_rule": data.get("lsystem_rule"),
                "lsystem_iterations": int(data.get("lsystem_iterations", 4)),
                "seed": seed,
                "parse_method": "claude_api",
            }
        except Exception as e:
            logger.warning(f"Claude parse failed ({e}); using keyword fallback")

    return _keyword_fallback(text, seed)


def parse_biome(theme: str) -> list:
    """
    Parse a biome theme into a list of plant variant dicts.
    Each dict has: description, x_offset, z_offset, plant_name.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if api_key:
        try:
            import anthropic
            client = anthropic.Anthropic()
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=800,
                system=_BIOME_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": f"Biome: {theme}"}],
            )
            raw = response.content[0].text.strip()
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            variants = json.loads(raw)
            if isinstance(variants, list) and len(variants) > 0:
                return variants[:7]  # max 7
        except Exception as e:
            logger.warning(f"Biome parse failed ({e}); using fallback")

    # Fallback: 3 generic plants
    return [
        {"description": f"a tall tree suited to a {theme}", "x_offset": 0.0, "z_offset": 0.0, "plant_name": "Canopy Tree"},
        {"description": f"a medium shrub suited to a {theme}", "x_offset": 5.0, "z_offset": 3.0, "plant_name": "Shrub"},
        {"description": f"a small ground plant suited to a {theme}", "x_offset": -4.0, "z_offset": -2.0, "plant_name": "Ground Plant"},
    ]
