"""
Leaf Instancer.

Converts LeafInstance list into instanced quad geometry.
Adapted from fractal-trees-2 with updated imports.
"""

import numpy as np
from typing import List, Tuple

from .types import GeometryConfig, LeafInstance

Vertices = np.ndarray
UVs = np.ndarray
Faces = np.ndarray


def leaf_quad(leaf: LeafInstance, width: float, height: float) -> Tuple[Vertices, UVs, Faces]:
    normal = leaf.normal.astype(np.float64)
    normal /= np.linalg.norm(normal) + 1e-8

    up = np.array([0, 1, 0], dtype=np.float64)
    if abs(np.dot(normal, up)) > 0.99:
        up = np.array([1, 0, 0], dtype=np.float64)

    right = np.cross(normal, up)
    right /= np.linalg.norm(right) + 1e-8
    up_local = np.cross(right, normal)

    w = width * leaf.scale * 0.5
    h = height * leaf.scale * 0.5
    pos = leaf.position.astype(np.float64)

    verts = np.array([
        pos - right * w - up_local * h,
        pos + right * w - up_local * h,
        pos + right * w + up_local * h,
        pos - right * w + up_local * h,
    ], dtype=np.float32)

    uvs = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], dtype=np.float32)
    faces = np.array([[0, 1, 2], [0, 2, 3]], dtype=np.uint32)
    return verts, uvs, faces


def build_leaf_mesh(
    leaves: List[LeafInstance],
    config: GeometryConfig,
) -> Tuple[Vertices, UVs, Faces]:
    all_verts, all_uvs, all_faces = [], [], []
    offset = 0

    for leaf in leaves:
        verts, uvs, faces = leaf_quad(leaf, config.leaf_quad_width, config.leaf_quad_height)
        all_verts.append(verts)
        all_uvs.append(uvs)
        all_faces.append(faces + offset)
        offset += 4

    if not all_verts:
        return (
            np.empty((0, 3), dtype=np.float32),
            np.empty((0, 2), dtype=np.float32),
            np.empty((0, 3), dtype=np.uint32),
        )
    return np.vstack(all_verts), np.vstack(all_uvs), np.vstack(all_faces)
