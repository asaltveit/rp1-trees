"""
Branch Algorithm — L-System.

Grammar-based tree generation. Adapted from fractal-trees-2 with import
paths updated for the self-contained api/plant/ package.

Default axiom: F
Rules:
  F → F[+F^F][-F^F][^F]

Turtle interpretation:
  F = draw forward (create branch segment)
  + = turn left (around Y axis)
  - = turn right
  [ = push state
  ] = pop state
  ^ = pitch up
  v = pitch down
"""

import logging
from typing import List, Optional

import numpy as np

from .types import TreeParameters, ProceduralConfig, TrunkSpline, BranchSegment
from .growth_constraints import GrowthEnvelope

logger = logging.getLogger(__name__)


def _expand(axiom: str, rules: dict, iterations: int) -> str:
    s = axiom
    for _ in range(iterations):
        s = "".join(rules.get(c, c) for c in s)
    return s


def _validate_rule(rule: str) -> bool:
    """Basic sanity check: rule must only contain known turtle chars."""
    allowed = set("F+-^v[]")
    return all(c in allowed for c in rule)


class TurtleState:
    def __init__(self, pos, direction, up, radius, depth):
        self.pos = pos.copy()
        self.direction = direction.copy()
        self.up = up.copy()
        self.radius = radius
        self.depth = depth


class LSystemGenerator:
    """L-System branch generator — zero scipy dependency."""

    DEFAULT_RULE = "F[+F^F][-F^F][^F]"

    def __init__(
        self,
        params: TreeParameters,
        config: ProceduralConfig,
        rng: np.random.Generator,
        envelope: GrowthEnvelope,
    ):
        self.params = params
        self.config = config
        self.rng = rng
        self.envelope = envelope

        self.angle = np.radians(params.branch_angle_mean)
        self.angle_var = np.radians(params.branch_angle_variance)
        self.decay = params.branch_length_decay
        self.step = params.height / 10.0

    def _rotate_around(self, vec: np.ndarray, axis: np.ndarray, angle: float) -> np.ndarray:
        c, s = np.cos(angle), np.sin(angle)
        k = axis / (np.linalg.norm(axis) + 1e-8)
        return vec * c + np.cross(k, vec) * s + k * np.dot(k, vec) * (1 - c)

    def generate(self, trunk_spline: TrunkSpline) -> List[BranchSegment]:
        # Determine rule string
        rule = self.DEFAULT_RULE
        if self.config.lsystem_rule and _validate_rule(self.config.lsystem_rule):
            rule = self.config.lsystem_rule

        rules = {"F": rule}
        iterations = min(self.config.max_branch_depth, 4)
        lstring = _expand("F", rules, iterations)
        logger.info(f"L-System string length: {len(lstring)}")

        root = trunk_spline.control_points[0].astype(np.float64)
        direction = np.array([0, 1, 0], dtype=np.float64)
        up = np.array([0, 0, 1], dtype=np.float64)

        stack = []
        state = TurtleState(root, direction, up, trunk_spline.radii[0], 0)
        branches: List[BranchSegment] = []

        for ch in lstring:
            if len(branches) >= 1500:  # cap for Vercel timeout safety
                break
            if ch == "F":
                step = self.step * (self.decay ** state.depth)
                if step < 0.01:
                    continue
                end = state.pos + state.direction * step
                if not self.envelope.contains(end.astype(np.float32)):
                    end = self.envelope.clamp(end.astype(np.float32)).astype(np.float64)
                r_end = max(state.radius * self.decay, 0.005)
                branches.append(BranchSegment(
                    start=state.pos.astype(np.float32),
                    end=end.astype(np.float32),
                    radius_start=state.radius,
                    radius_end=r_end,
                    depth=state.depth,
                    parent=len(branches) - 1 if branches else None,
                ))
                state.pos = end
                state.radius = r_end
            elif ch == "+":
                a = self.angle + self.rng.uniform(-self.angle_var, self.angle_var)
                state.direction = self._rotate_around(state.direction, np.array([0, 1, 0]), a)
            elif ch == "-":
                a = self.angle + self.rng.uniform(-self.angle_var, self.angle_var)
                state.direction = self._rotate_around(state.direction, np.array([0, 1, 0]), -a)
            elif ch == "^":
                a = self.angle * 0.5
                axis = np.cross(state.direction, np.array([0, 1, 0]))
                if np.linalg.norm(axis) > 1e-6:
                    state.direction = self._rotate_around(state.direction, axis, a)
            elif ch == "v":
                a = self.angle * 0.5
                axis = np.cross(state.direction, np.array([0, 1, 0]))
                if np.linalg.norm(axis) > 1e-6:
                    state.direction = self._rotate_around(state.direction, axis, -a)
            elif ch == "[":
                stack.append(TurtleState(
                    state.pos, state.direction, state.up,
                    state.radius, state.depth + 1,
                ))
            elif ch == "]":
                if stack:
                    state = stack.pop()

        logger.info(f"L-System: {len(branches)} branches")
        return branches
