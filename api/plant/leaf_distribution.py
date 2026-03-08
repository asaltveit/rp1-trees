"""
Leaf Placement.

Places leaf instances at terminal branches using probabilistic distribution.
Adapted from fractal-trees-2 with updated imports.
"""

import logging
from typing import List

import numpy as np

from .types import TreeParameters, BranchSegment, LeafInstance

logger = logging.getLogger(__name__)

SUN_DIR = np.array([0.3, 0.9, 0.3], dtype=np.float32)
SUN_DIR /= np.linalg.norm(SUN_DIR)


def _leaf_normal(branch_dir: np.ndarray, droop: float = 0.15) -> np.ndarray:
    up = np.array([0, 1, 0], dtype=np.float32)
    normal = SUN_DIR.copy()
    normal[1] -= droop
    perp = np.cross(branch_dir, up)
    perp_norm = np.linalg.norm(perp)
    if perp_norm > 1e-6:
        normal += 0.3 * (perp / perp_norm)
    norm_len = np.linalg.norm(normal)
    return (normal / norm_len).astype(np.float32) if norm_len > 1e-6 else up


def place_leaves(
    branches: List[BranchSegment],
    params: TreeParameters,
    rng: np.random.Generator,
) -> List[LeafInstance]:
    max_depth = max((b.depth for b in branches), default=0)
    terminal_depth_threshold = max(max_depth - 2, 1)

    leaves: List[LeafInstance] = []
    for branch in branches:
        if branch.depth < terminal_depth_threshold:
            continue
        branch_dir = branch.end - branch.start
        length = float(np.linalg.norm(branch_dir))
        if length < 1e-4:
            continue
        branch_dir_norm = (branch_dir / length).astype(np.float32)
        n_leaves = int(length * params.leaf_density * 20)
        n_leaves = max(n_leaves, 1)

        for _ in range(n_leaves):
            if rng.random() > params.leaf_density:
                continue
            t = rng.uniform(0.2, 1.0)
            pos = (branch.start + t * branch_dir).astype(np.float32)
            normal = _leaf_normal(branch_dir_norm)
            angle = rng.uniform(-0.4, 0.4)
            cos_a, sin_a = np.cos(angle), np.sin(angle)
            n = normal.copy()
            n[0] = normal[0] * cos_a - normal[2] * sin_a
            n[2] = normal[0] * sin_a + normal[2] * cos_a
            scale = rng.uniform(0.7, 1.3)
            leaves.append(LeafInstance(pos, n.astype(np.float32), scale))

    logger.info(f"Placed {len(leaves)} leaves")
    return leaves
