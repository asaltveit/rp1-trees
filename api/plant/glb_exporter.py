"""
GLB Exporter — Pillow-only (no cv2).

Exports tree mesh + textures as a binary glTF 2.0 (.glb).
Compatible with WebXR. Textures are embedded as PNG blobs.
"""

import json
import logging
import struct
from typing import Optional

import numpy as np
from PIL import Image

from .types import TreeMesh
from .texture_gen import texture_to_png_bytes

logger = logging.getLogger(__name__)


def export_glb_to_bytes(mesh: TreeMesh) -> bytes:
    """
    Export TreeMesh to GLB bytes using pygltflib.
    Falls back to minimal hand-written GLB if pygltflib is absent.
    """
    try:
        import pygltflib
        return _export_pygltflib(mesh)
    except ImportError:
        logger.warning("pygltflib not installed; using minimal GLB exporter")
        return _export_minimal_glb(mesh)


def _img_to_png_bytes(img: Optional[Image.Image]) -> Optional[bytes]:
    if img is None:
        return None
    return texture_to_png_bytes(img)


def _export_pygltflib(mesh: TreeMesh) -> bytes:
    import pygltflib
    from pygltflib import (
        GLTF2, Scene, Node, Mesh, Primitive, Accessor, BufferView, Buffer,
        Material, Texture, Image as GltfImage, Sampler,
        ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER,
        FLOAT, UNSIGNED_INT,
    )

    gltf = GLTF2()
    gltf.scene = 0
    gltf.scenes = [Scene(nodes=[0])]

    binary_data = bytearray()

    def add_buffer_view(data: bytes, target: int) -> int:
        offset = len(binary_data)
        binary_data.extend(data)
        while len(binary_data) % 4:
            binary_data.append(0)
        bv = BufferView(buffer=0, byteOffset=offset, byteLength=len(data), target=target)
        idx = len(gltf.bufferViews)
        gltf.bufferViews.append(bv)
        return idx

    def add_accessor(bv_idx: int, count: int, comp_type: int, acc_type: str,
                     min_=None, max_=None) -> int:
        acc = Accessor(
            bufferView=bv_idx, byteOffset=0,
            componentType=comp_type, count=count, type=acc_type,
        )
        if min_ is not None:
            acc.min = min_
        if max_ is not None:
            acc.max = max_
        idx = len(gltf.accessors)
        gltf.accessors.append(acc)
        return idx

    primitives = []

    # Trunk primitive
    if len(mesh.trunk_verts) > 0:
        verts = mesh.trunk_verts.astype(np.float32)
        faces = mesh.trunk_faces.astype(np.uint32)
        uvs   = mesh.trunk_uvs.astype(np.float32)

        pos_bv = add_buffer_view(verts.tobytes(), ARRAY_BUFFER)
        idx_bv = add_buffer_view(faces.tobytes(), ELEMENT_ARRAY_BUFFER)
        uv_bv  = add_buffer_view(uvs.tobytes(),   ARRAY_BUFFER)

        pos_acc = add_accessor(pos_bv, len(verts), FLOAT, "VEC3",
                               verts.min(0).tolist(), verts.max(0).tolist())
        idx_acc = add_accessor(idx_bv, faces.size, UNSIGNED_INT, "SCALAR")
        uv_acc  = add_accessor(uv_bv,  len(uvs),  FLOAT, "VEC2")

        primitives.append(Primitive(
            attributes=pygltflib.Attributes(POSITION=pos_acc, TEXCOORD_0=uv_acc),
            indices=idx_acc,
            material=0,
        ))

    # Leaf primitive
    if len(mesh.leaf_verts) > 0:
        verts = mesh.leaf_verts.astype(np.float32)
        faces = mesh.leaf_faces.astype(np.uint32)
        uvs   = mesh.leaf_uvs.astype(np.float32)

        pos_bv = add_buffer_view(verts.tobytes(), ARRAY_BUFFER)
        idx_bv = add_buffer_view(faces.tobytes(), ELEMENT_ARRAY_BUFFER)
        uv_bv  = add_buffer_view(uvs.tobytes(),   ARRAY_BUFFER)

        pos_acc = add_accessor(pos_bv, len(verts), FLOAT, "VEC3")
        idx_acc = add_accessor(idx_bv, faces.size, UNSIGNED_INT, "SCALAR")
        uv_acc  = add_accessor(uv_bv,  len(uvs),  FLOAT, "VEC2")

        primitives.append(Primitive(
            attributes=pygltflib.Attributes(POSITION=pos_acc, TEXCOORD_0=uv_acc),
            indices=idx_acc,
            material=1,
        ))

    gltf.meshes = [Mesh(primitives=primitives)]
    gltf.nodes = [Node(mesh=0)]

    # Materials & Textures
    def add_image_from_pil(img: Optional[Image.Image], name: str) -> Optional[int]:
        if img is None:
            return None
        img_bytes = _img_to_png_bytes(img)
        bv_idx = add_buffer_view(img_bytes, 0)
        img_idx = len(gltf.images)
        gltf.images.append(GltfImage(bufferView=bv_idx, mimeType="image/png", name=name))
        gltf.samplers.append(Sampler())
        tex_idx = len(gltf.textures)
        gltf.textures.append(Texture(source=img_idx, sampler=len(gltf.samplers) - 1))
        return tex_idx

    bark_tex_idx = add_image_from_pil(mesh.atlas.bark_texture, "bark")
    leaf_tex_idx = add_image_from_pil(mesh.atlas.leaf_texture, "leaves")

    def pbr_material(tex_idx: Optional[int], name: str, alpha: str = "OPAQUE") -> Material:
        mat = Material(name=name, alphaMode=alpha)
        if tex_idx is not None:
            mat.pbrMetallicRoughness = pygltflib.PbrMetallicRoughness(
                baseColorTexture=pygltflib.TextureInfo(index=tex_idx),
                roughnessFactor=0.9,
                metallicFactor=0.0,
            )
        return mat

    gltf.materials = [
        pbr_material(bark_tex_idx, "bark_material"),
        pbr_material(leaf_tex_idx, "leaf_material", alpha="MASK"),
    ]

    gltf.buffers = [Buffer(byteLength=len(binary_data))]
    gltf.set_binary_blob(bytes(binary_data))

    glb_bytes = bytes(gltf.save_to_bytes())
    logger.info(f"GLB exported: {len(glb_bytes) / 1024:.0f} KB")
    return glb_bytes


def _export_minimal_glb(mesh: TreeMesh) -> bytes:
    """Minimal hand-written GLB fallback (no textures, positions only)."""
    verts = mesh.trunk_verts.astype(np.float32)
    faces = mesh.trunk_faces.astype(np.uint32)

    if len(verts) == 0:
        verts = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0]], dtype=np.float32)
        faces = np.array([[0, 1, 2]], dtype=np.uint32)

    pos_bin = verts.tobytes()
    idx_bin = faces.tobytes()

    json_dict = {
        "asset": {"version": "2.0", "generator": "plant_generator"},
        "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"mesh": 0}],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0}, "indices": 1}]}],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": len(verts),
             "type": "VEC3", "min": verts.min(0).tolist(), "max": verts.max(0).tolist()},
            {"bufferView": 1, "componentType": 5125, "count": faces.size, "type": "SCALAR"},
        ],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": len(pos_bin), "target": 34962},
            {"buffer": 0, "byteOffset": len(pos_bin), "byteLength": len(idx_bin), "target": 34963},
        ],
        "buffers": [{"byteLength": len(pos_bin) + len(idx_bin)}],
    }

    json_bytes = json.dumps(json_dict, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4:
        json_bytes += b" "

    bin_data = pos_bin + idx_bin
    while len(bin_data) % 4:
        bin_data += b"\x00"

    total = 12 + 8 + len(json_bytes) + 8 + len(bin_data)
    header     = struct.pack("<III", 0x46546C67, 2, total)
    json_chunk = struct.pack("<II", len(json_bytes), 0x4E4F534A) + json_bytes
    bin_chunk  = struct.pack("<II", len(bin_data), 0x004E4942) + bin_data

    return header + json_chunk + bin_chunk
