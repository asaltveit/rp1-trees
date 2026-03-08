"""
Shared dataclasses for the plant generation pipeline.
All types live here to avoid circular imports.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Any

import numpy as np


@dataclass
class TrunkSpline:
    """Pure-numpy trunk spline (no scipy). Catmull-Rom evaluated on demand."""
    control_points: np.ndarray   # (n, 3) float32
    radii: np.ndarray            # (n,) float32
    total_length: float


@dataclass
class CanopyEstimate:
    centroid: np.ndarray     # (3,) float32 — centre of canopy sphere
    trunk_base: np.ndarray   # (3,) float32 — bottom of trunk
    height: float            # metres, trunk_base to top
    canopy_radius: float     # metres, horizontal spread


@dataclass
class TreeParameters:
    height: float
    canopy_radius: float
    trunk_base_radius: float
    trunk_tip_radius: float
    branch_density: float
    branch_angle_mean: float       # degrees
    branch_angle_variance: float   # degrees (std dev)
    branch_length_decay: float     # child/parent length ratio
    leaf_density: float            # 0–1
    tropism: str                   # "upward" | "downward" | "outward"
    seed: int = 42


@dataclass
class ProceduralConfig:
    seed: int = 42
    max_branch_depth: int = 4
    branch_algorithm: str = "lsystem"
    lsystem_rule: Optional[str] = None   # override grammar rule string


@dataclass
class GeometryConfig:
    leaf_quad_width: float = 0.3
    leaf_quad_height: float = 0.4


@dataclass
class BranchSegment:
    start: np.ndarray        # (3,) float32
    end: np.ndarray          # (3,) float32
    radius_start: float
    radius_end: float
    depth: int               # 0 = trunk
    parent: Optional[int] = None


@dataclass
class LeafInstance:
    position: np.ndarray     # (3,) float32
    normal: np.ndarray       # (3,) float32
    scale: float = 1.0


@dataclass
class ProceduralTree:
    branches: List[BranchSegment] = field(default_factory=list)
    leaves: List[LeafInstance] = field(default_factory=list)
    trunk_spline: Optional[TrunkSpline] = None
    seed: int = 42


@dataclass
class TextureAtlas:
    bark_texture: Any = None   # PIL.Image RGB
    leaf_texture: Any = None   # PIL.Image RGBA


@dataclass
class TreeMesh:
    trunk_verts: np.ndarray
    trunk_faces: np.ndarray
    trunk_uvs: np.ndarray
    leaf_verts: np.ndarray
    leaf_faces: np.ndarray
    leaf_uvs: np.ndarray
    atlas: TextureAtlas
