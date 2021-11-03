# C3 - Consistent Categorical Colors

A library to generate distinct categorical colors, written in TypeScript.

[Documentation](https://mapequation.github.io/c3)

### Install

`npm install @mapequation/c3`

### Features
* **Unlimited colors**: Generate as many colors you want
* **Any color scheme**: We generate color stops on the interval `[0, 1]`. Perfect to use with [d3](https://github.com/d3/d3-scale-chromatic).
* **Deterministic**: You always get the same colors for the same requested number of colors.
* **Consistent**: If you increase the number of colors, it doesn't change the list of colors you already have.
* **Fast**: The complexity is `O(n log(n))` for `n` colors.

The algorithm is inspired by the [Cantor set](https://en.wikipedia.org/wiki/Cantor_set),
which is a fractal that subdivides an interval recursively into smaller subsets.

### Authors
Daniel Edler, Anton Eriksson
