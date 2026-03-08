"""
Plant Generator — main orchestration for a single plant.

Takes a parsed parameter dict and returns GLB bytes + metadata.
"""

import logging
from typing import Tuple

import numpy as np

from .types import (
    ProceduralConfig, GeometryConfig, TextureAtlas, TreeMesh,
    ProceduralTree,
)
from .geometry_synthesizer import synthesize_trunk, synthesize_canopy, synthesize_tree_params
from .growth_constraints import GrowthEnvelope
from .lsystem import LSystemGenerator
from .leaf_distribution import place_leaves
from .branch_mesh import branch_to_mesh, branch_uvs, merge_meshes
from .leaf_instancer import build_leaf_mesh
from .texture_gen import generate_bark_texture, generate_leaf_texture
from .glb_exporter import export_glb_to_bytes

logger = logging.getLogger(__name__)


def generate_plant(params: dict) -> Tuple[bytes, dict]:
    """
    Generate a single plant GLB from a parameter dict.

    Args:
        params: dict from text_parser.parse_description() or similar

    Returns:
        (glb_bytes, metadata_dict)
    """
    seed = int(params.get("seed", 42))
    rng = np.random.default_rng(seed)

    # 1. Synthesize structural objects
    trunk_spline = synthesize_trunk(params)
    canopy = synthesize_canopy(params)
    tree_params = synthesize_tree_params(params)

    # 2. Build procedural config
    proc_config = ProceduralConfig(
        seed=seed,
        max_branch_depth=int(params.get("lsystem_iterations", 4)),
        branch_algorithm="lsystem",
        lsystem_rule=params.get("lsystem_rule"),
    )

    # 3. Generate branches via L-system
    envelope = GrowthEnvelope(canopy)
    generator = LSystemGenerator(tree_params, proc_config, rng, envelope)
    branches = generator.generate(trunk_spline)

    if not branches:
        logger.warning("No branches generated; using minimal fallback")
        from .types import BranchSegment
        branches = [BranchSegment(
            start=np.array([0, 0, 0], dtype=np.float32),
            end=np.array([0, tree_params.height, 0], dtype=np.float32),
            radius_start=tree_params.trunk_base_radius,
            radius_end=tree_params.trunk_tip_radius,
            depth=0,
        )]

    # 4. Place leaves
    leaves = place_leaves(branches, tree_params, rng)

    # 5. Build branch mesh
    branch_meshes = []
    branch_uv_list = []
    for branch in branches:
        verts, faces = branch_to_mesh(branch, segments=6)
        uvs = branch_uvs(branch, segments=6)
        if len(verts) > 0:
            branch_meshes.append((verts, faces))
            branch_uv_list.append(uvs)

    if branch_meshes:
        trunk_verts, trunk_faces = merge_meshes(branch_meshes)
        # Merge UVs to match merged vertex order
        import numpy as _np
        all_uvs = []
        offset = 0
        for uvs in branch_uv_list:
            all_uvs.append(uvs)
            offset += len(uvs)
        trunk_uvs = _np.vstack(all_uvs) if all_uvs else _np.empty((0, 2), dtype=_np.float32)
    else:
        trunk_verts = np.empty((0, 3), dtype=np.float32)
        trunk_faces = np.empty((0, 3), dtype=np.uint32)
        trunk_uvs = np.empty((0, 2), dtype=np.float32)

    # 6. Build leaf mesh
    geo_config = GeometryConfig(leaf_quad_width=0.3, leaf_quad_height=0.4)
    leaf_verts, leaf_uvs, leaf_faces = build_leaf_mesh(leaves, geo_config)

    # 7. Generate textures
    bark_hsv = params.get("bark_color_hsv", [30, 40, 30])
    leaf_hsv = params.get("leaf_color_hsv", [110, 60, 38])
    bark_tex = generate_bark_texture(bark_hsv, size=512, seed=seed)
    leaf_tex = generate_leaf_texture(leaf_hsv, size=256, seed=seed)

    atlas = TextureAtlas(bark_texture=bark_tex, leaf_texture=leaf_tex)

    mesh = TreeMesh(
        trunk_verts=trunk_verts,
        trunk_faces=trunk_faces,
        trunk_uvs=trunk_uvs,
        leaf_verts=leaf_verts,
        leaf_faces=leaf_faces,
        leaf_uvs=leaf_uvs,
        atlas=atlas,
    )

    # 8. Export GLB
    glb_bytes = export_glb_to_bytes(mesh)

    species_id = params.get("species_id", "generic_deciduous")
    plant_name = params.get("plant_name", species_id.replace("_", " ").title())

    metadata = {
        "species_id": species_id,
        "plant_name": plant_name,
        "height_m": params.get("height_m", 10.0),
        "branch_count": len(branches),
        "leaf_count": len(leaves),
        "parse_method": params.get("parse_method", "keyword"),
        "glb_size_kb": round(len(glb_bytes) / 1024, 1),
    }

    logger.info(f"Generated {plant_name}: {len(branches)} branches, {len(leaves)} leaves, {metadata['glb_size_kb']} KB")
    return glb_bytes, metadata
