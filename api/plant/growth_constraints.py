"""
Growth Envelope Constraint.

All procedural branches must stay inside the estimated canopy volume.
Implemented as a cylinder constraint.
"""

import numpy as np
from .types import CanopyEstimate


class GrowthEnvelope:
    """Cylindrical growth envelope from canopy estimate."""

    def __init__(self, canopy: CanopyEstimate, margin: float = 0.05):
        self.centre_xz = canopy.centroid[[0, 2]]
        self.y_min = float(canopy.trunk_base[1])
        self.y_max = float(canopy.centroid[1] + canopy.height * 0.5)
        self.radius = float(canopy.canopy_radius * (1 + margin))

    def contains(self, point: np.ndarray) -> bool:
        xz = point[[0, 2]]
        horiz_dist = float(np.linalg.norm(xz - self.centre_xz))
        return bool(horiz_dist <= self.radius and self.y_min <= point[1] <= self.y_max)

    def clamp(self, point: np.ndarray) -> np.ndarray:
        p = point.copy()
        p[1] = float(np.clip(p[1], self.y_min, self.y_max))
        xz = p[[0, 2]]
        dist = float(np.linalg.norm(xz - self.centre_xz))
        if dist > self.radius:
            xz_norm = (xz - self.centre_xz) / (dist + 1e-8)
            p[[0, 2]] = self.centre_xz + xz_norm * self.radius
        return p
