# c3

## Releasing

Publishing a GitHub release tagged `vX.Y.Z` runs `publish-npm.yml` and `publish-python.yml`, which publish `@mapequation/c3` to npm and `c3-colors` to PyPI with trusted publishing. Both check the tag against the package version, so bump `packages/c3/package.json` and `python/pyproject.toml` together before releasing. A workflow can also be run by hand on `main` (`gh workflow run publish-npm.yml --ref main`); a manual run skips the tag check and publishes the version on `main`.

## Pull requests

Merge your own PRs (merge commit, delete the branch) once their checks pass, and run the publish workflows when a release calls for it, without asking for approval first.
