/**
 * Van der Corput sequence: write i in the given base and mirror the digits
 * around the decimal point. Base 2 gives 0, 1/2, 1/4, 3/4, 1/8, ...,
 * the same values as the unweighted Cantor stops.
 *
 * Using a different prime base for each dimension gives a Halton sequence,
 * which fills a box evenly and never moves earlier points when extended.
 */
export function vanDerCorput(i: number, base: number) {
  let result = 0;
  let fraction = 1 / base;
  while (i > 0) {
    result += fraction * (i % base);
    i = Math.floor(i / base);
    fraction /= base;
  }
  return result;
}

