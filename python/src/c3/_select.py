"""Choosing distinct colors by distance."""

from __future__ import annotations

import math
from collections.abc import Callable, Sequence

from ._oklab import Lab, lab_distance


def farthest(picked: Sequence[Lab], count: float, candidates: Sequence[Lab], stop_below: float = 0) -> list[Lab]:
    """
    Each new color is the candidate farthest from all colors so far.
    Stops early if the farthest is closer than stop_below. O(count * candidates).
    """
    result: list[Lab] = []
    if count <= 0 or len(candidates) == 0:
        return result

    min_dist = [math.inf] * len(candidates)

    def update(p: Lab) -> None:
        for i, c in enumerate(candidates):
            d = lab_distance(c, p)
            if d < min_dist[i]:
                min_dist[i] = d

    for p in picked:
        update(p)

    while len(result) < count:
        best = 0
        for i in range(1, len(candidates)):
            if min_dist[i] > min_dist[best]:
                best = i
        if min_dist[best] < stop_below:
            break
        result.append(candidates[best])
        update(candidates[best])
    return result


def lookahead(
    picked: Sequence[Lab],
    count: float,
    candidate_at: Callable[[int], Lab],
    window: int,
    stop_below: float = 0,
) -> list[Lab]:
    """
    Each new color is the farthest from all colors so far of the next window
    unused candidates in a sequence. Stops early if it is closer than stop_below.
    """
    result: list[Lab] = []
    if count <= 0:
        return result

    chosen = list(picked)
    points: list[Lab] = []
    min_dist: list[float] = []
    used: list[bool] = []
    first = 0  # first unused point

    def point(k: int) -> int:
        while len(points) <= k:
            p = candidate_at(len(points))
            points.append(p)
            min_dist.append(min((lab_distance(p, q) for q in chosen), default=math.inf))
            used.append(False)
        return k

    while len(result) < count:
        best = -1
        k = first
        seen = 0
        while seen < window:
            if used[point(k)]:
                k += 1
                continue
            seen += 1
            if best == -1 or min_dist[k] > min_dist[best]:
                best = k
            k += 1
        if min_dist[best] < stop_below:
            break
        p = points[best]
        used[best] = True
        chosen.append(p)
        result.append(p)
        for k in range(first, len(points)):
            d = lab_distance(points[k], p)
            if d < min_dist[k]:
                min_dist[k] = d
        while first < len(used) and used[first]:
            first += 1
    return result
