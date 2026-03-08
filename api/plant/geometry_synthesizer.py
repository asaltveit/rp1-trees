"""
Geometry Synthesizer — scipy-free.

Converts a ParsedDescription into TrunkSpline + CanopyEstimate + TreeParameters.
Uses a pure-numpy Catmull-Rom spline (replaces scipy splprep/splev).
"""

import logging
from typing import Optional

import numpy as np

from .types import TrunkSpline, CanopyEstimate, TreeParameters, ProceduralConfig

logger = logging.getLogger(__name__)

# ─── Species database (branch defaults) ────────────────────────────────────
SPECIES_DB = {
    "oak":               {"angle": 35, "angle_var": 12, "decay": 0.68, "leaf_density": 0.85, "tropism": "outward"},
    "pine":              {"angle": 20, "angle_var": 8,  "decay": 0.62, "leaf_density": 0.60, "tropism": "upward"},
    "birch":             {"angle": 25, "angle_var": 10, "decay": 0.70, "leaf_density": 0.75, "tropism": "upward"},
    "willow":            {"angle": 30, "angle_var": 15, "decay": 0.72, "leaf_density": 0.90, "tropism": "downward"},
    "maple":             {"angle": 38, "angle_var": 12, "decay": 0.66, "leaf_density": 0.80, "tropism": "outward"},
    "palm":              {"angle": 50, "angle_var": 20, "decay": 0.55, "leaf_density": 0.40, "tropism": "outward"},
    "generic_deciduous": {"angle": 35, "angle_var": 12, "decay": 0.67, "leaf_density": 0.80, "tropism": "outward"},
    "generic_conifer":   {"angle": 22, "angle_var": 8,  "decay": 0.63, "leaf_density": 0.65, "tropism": "upward"},
}

KNOWN_SPECIES = list(SPECIES_DB.keys())


# ─── Catmull-Rom spline (pure numpy) ───────────────────────────────────────

def _catmull_rom_sample(ctrl: np.ndarray, t: float) -> np.ndarray:
    """Evaluate Catmull-Rom spline at t ∈ [0, 1]."""
    n = len(ctrl)
    seg = t * (n - 1)
    i = int(min(seg, n - 2))
    lt = seg - i
    p0 = ctrl[max(0, i - 1)]
    p1 = ctrl[i]
    p2 = ctrl[min(n - 1, i + 1)]
    p3 = ctrl[min(n - 1, i + 2)]
    return 0.5 * (
        2 * p1
        + (-p0 + p2) * lt
        + (2 * p0 - 5 * p1 + 4 * p2 - p3) * lt ** 2
        + (-p0 + 3 * p1 - 3 * p2 + p3) * lt ** 3
    )


def _arc_length(ctrl: np.ndarray, samples: int = 100) -> float:
    pts = np.array([_catmull_rom_sample(ctrl, t) for t in np.linspace(0, 1, samples)])
    return float(np.linalg.norm(np.diff(pts, axis=0), axis=1).sum())


# ─── Synthesis functions ────────────────────────────────────────────────────

def synthesize_trunk(parsed: dict) -> TrunkSpline:
    """Build a Catmull-Rom TrunkSpline from ParsedDescription dict."""
    h = float(parsed.get("height_m", 10.0))
    curvature = float(parsed.get("trunk_curvature", 0.3))
    size_scale = float(parsed.get("size_scale", 1.0))

    n_ctrl = 4
    y_vals = np.linspace(0.0, h, n_ctrl)
    ctrl = np.zeros((n_ctrl, 3), dtype=np.float64)
    ctrl[:, 1] = y_vals

    if curvature > 0:
        canopy_r = float(parsed.get("canopy_radius_m", h * 0.35))
        max_disp = curvature * canopy_r * 0.15
        for i in range(1, n_ctrl - 1):
            t = i / (n_ctrl - 1)
            ctrl[i, 0] += max_disp * np.sin(t * np.pi) * np.cos(t * np.pi * 1.5)

    base_r = max(0.015 * h * size_scale, 0.05)
    tip_r = max(base_r * 0.08, 0.01)
    radii = np.linspace(base_r, tip_r, n_ctrl, dtype=np.float32)
    arc = _arc_length(ctrl)

    return TrunkSpline(
        control_points=ctrl.astype(np.float32),
        radii=radii,
        total_length=arc,
    )


def synthesize_canopy(parsed: dict) -> CanopyEstimate:
    h = float(parsed.get("height_m", 10.0))
    r = float(parsed.get("canopy_radius_m", h * 0.35))
    centroid = np.array([0.0, h * 0.75, 0.0], dtype=np.float32)
    trunk_base = np.array([0.0, 0.0, 0.0], dtype=np.float32)
    return CanopyEstimate(centroid=centroid, trunk_base=trunk_base, height=h, canopy_radius=r)


def synthesize_tree_params(parsed: dict) -> TreeParameters:
    species_id = parsed.get("species_id", "generic_deciduous")
    if species_id not in SPECIES_DB:
        species_id = "generic_deciduous"
    db = SPECIES_DB[species_id]

    h = float(parsed.get("height_m", 10.0))
    r = float(parsed.get("canopy_radius_m", h * 0.35))

    angle_mean = float(db["angle"]) + float(parsed.get("branch_angle_modifier", 0.0))
    angle_mean = float(np.clip(angle_mean, 5.0, 70.0))

    leaf_density = float(db["leaf_density"]) * float(parsed.get("leaf_density_modifier", 1.0))
    leaf_density = float(np.clip(leaf_density, 0.05, 1.5))

    base_r = max(0.015 * h * float(parsed.get("size_scale", 1.0)), 0.05)

    return TreeParameters(
        height=h,
        canopy_radius=r,
        trunk_base_radius=base_r,
        trunk_tip_radius=max(base_r * 0.08, 0.01),
        branch_density=3.0,
        branch_angle_mean=angle_mean,
        branch_angle_variance=float(db["angle_var"]),
        branch_length_decay=float(db["decay"]),
        leaf_density=leaf_density,
        tropism=str(db["tropism"]),
        seed=int(parsed.get("seed", 42)),
    )
