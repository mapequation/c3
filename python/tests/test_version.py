import json
import tomllib
from pathlib import Path

import c3

ROOT = Path(__file__).resolve().parents[2]


def test_version_matches_the_npm_package():
    pyproject = tomllib.loads((ROOT / "python" / "pyproject.toml").read_text())
    package = json.loads((ROOT / "packages" / "c3" / "package.json").read_text())
    assert pyproject["project"]["version"] == package["version"]
    assert c3.__version__ == package["version"]
