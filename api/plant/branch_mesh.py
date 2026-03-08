"""
Branch Mesh Generation.

Converts BranchSegment list into triangle mesh geometry (tapered cylinders).
Adapted from fractal-trees-2 with updated imports.
"""

import numpy as np
from typing import List, Tuple

from .types import BranchSegment

Vertices = np.ndarray   # (N, 3) float32
Faces = np.ndarray      # (M, 3) uint32


def _cylinder_ring(centre: np.ndarray, axis: np.ndarray, radius: float,
                   segments: int) -> np.ndarray:
    up = np.array([0, 1, 0], dtype=np.float64)
    if abs(np.dot(axis, up)) > 0.99:
        up = np.array([1, 0, 0], dtype=np.float64)
    right = np.cross(axis, up)
    right /= np.linalg.norm(right) + 1e-8
    fwd = np.cross(right, axis)
    fwd /= np.linalg.norm(fwd) + 1e-8

    angles = np.linspace(0, 2 * np.pi, segments, endpoint=False)
    return np.array([
        centre + radius * (np.cos(a) * right + np.sin(a) * fwd)
        for a in angles
    ], dtype=np.float32)


def branch_to_mesh(branch: BranchSegment, segments: int = 6) -> Tuple[Vertices, Faces]:
    axis = branch.end - branch.start
    length = float(np.linalg.norm(axis))
    if length < 1e-5:
        return np.empty((0, 3), dtype=np.float32), np.empty((0, 3), dtype=np.uint32)
    axis_norm = (axis / length).astype(np.float64)

    ring_start = _cylinder_ring(branch.start, axis_norm, branch.radius_start, segments)
    ring_end   = _cylinder_ring(branch.end,   axis_norm, branch.radius_end,   segments)
    verts = np.vstack([ring_start, ring_end]).astype(np.float32)

    faces = []
    for i in range(segments):
        a, b = i, (i + 1) % segments
        c, d = segments + i, segments + (i + 1) % segments
        faces.append([a, c, b])
        faces.append([b, c, d])

    cap_start = len(verts)
    cap_end = len(verts) + 1
    verts = np.vstack([verts, branch.start[None], branch.end[None]])

    for i in range(segments):
        b = (i + 1) % segments
        faces.append([cap_start, b, i])
    for i in range(segments):
        b = (i + 1) % segments
        faces.append([cap_end, segments + i, segments + b])

    return verts, np.array(faces, dtype=np.uint32)


def branch_uvs(branch: BranchSegment, segments: int = 6) -> np.ndarray:
    """Generate cylindrical UV coordinates for a branch cylinder."""
    n_verts = segments * 2 + 2
    uvs = np.zeros((n_verts, 2), dtype=np.float32)
    for i in range(segments):
        u = i / segments
        uvs[i] = [u, 0.0]
        uvs[segments + i] = [u, 1.0]
    uvs[-2] = [0.5, 0.0]
    uvs[-1] = [0.5, 1.0]
    return uvs


def merge_meshes(meshes: List[Tuple[Vertices, Faces]]) -> Tuple[Vertices, Faces]:
    all_verts, all_faces = [], []
    offset = 0
    for verts, faces in meshes:
        if len(verts) == 0:
            continue
        all_verts.append(verts)
        all_faces.append(faces + offset)
        offset += len(verts)
    if not all_verts:
        return np.empty((0, 3), dtype=np.float32), np.empty((0, 3), dtype=np.uint32)
    return np.vstack(all_verts), np.vstack(all_faces)
