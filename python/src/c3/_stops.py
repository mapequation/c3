"""Cantor stops and the van der Corput sequence."""

from __future__ import annotations

import math
import numbers
from collections.abc import Iterable, Sequence
from dataclasses import dataclass


def van_der_corput(i: float, base: int) -> float:
    """
    Van der Corput sequence: write i in the given base and mirror the digits
    around the decimal point. Base 2 gives 0, 1/2, 1/4, 3/4, 1/8, ...,
    the same values as the unweighted Cantor stops.
    """
    result = 0.0
    fraction = 1 / base
    while i > 0:
        i, digit = divmod(i, base)
        result += fraction * digit
        fraction /= base
    return result


class _Node:
    """An interval between two stops, with the weights of the stops at either end."""

    __slots__ = ("start", "end", "start_weight", "end_weight")

    def __init__(self, start: float, end: float, start_weight: float, end_weight: float):
        self.start = start
        self.end = end
        self.start_weight = start_weight
        self.end_weight = end_weight

    def split(self, weight: float, strength: float) -> _Node:
        """Split at a convex combination of the midpoint and the weighted split point."""
        weighted_fraction = self.start_weight / (self.start_weight + self.end_weight)
        fraction = (1 - strength) * 0.5 + strength * weighted_fraction
        split_point = self.start + fraction * (self.end - self.start)
        child = _Node(split_point, self.end, weight, self.end_weight)
        self.end = split_point
        self.end_weight = weight
        return child


@dataclass(frozen=True)
class Interval:
    start: float
    end: float


def stops(n: int | Sequence[float] = 10) -> list[Interval]:
    """
    Subdivide [0, 1] recursively like the Cantor set: each stop's start is a position
    0, 1/2, 1/4, 3/4, 1/8, ... for a count. Weights split each interval by the weights
    on either side, so heavier stops get more space. A zero weight counts as the
    smallest positive weight, so every stop gets some space.
    """
    if isinstance(n, numbers.Real):
        weights = [1.0] * _count(n)
        strength = 0
    else:
        weights = positive_weights(n)
        strength = 1
    if not weights:
        return []

    intervals = [_Node(0, 1, weights[0], weights[0])]
    while len(intervals) < len(weights):
        for j in range(len(intervals)):
            intervals.append(intervals[j].split(weights[len(intervals)], strength))
            if len(intervals) == len(weights):
                break
    return [Interval(node.start, node.end) for node in intervals]


def positive_weights(weights: Iterable[float]) -> list[float]:
    """
    Weights with each zero raised to the smallest positive weight, or all ones if none is
    positive, so zero weights get the smallest share instead of none.

    :raises ValueError: for a weight that isn't finite
    """
    weights = list(weights)
    for w in weights:
        if not math.isfinite(w):
            raise ValueError(f"Weights must be finite, got {w}")
    smallest = min((w for w in weights if w > 0), default=1)
    return [w if w > 0 else smallest for w in weights]


def _count(n: float) -> int:
    """A number of colors, which must be a non-negative integer."""
    if isinstance(n, bool) or not math.isfinite(n) or n < 0 or n != int(n):
        raise ValueError(f"Invalid number of colors: {n}")
    return int(n)
