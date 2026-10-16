"""Execute a notebook in place and drop run-specific metadata, so re-runs give small diffs.

    cd python && uv run --group notebook python examples/execute.py [notebook]

The notebook defaults to tutorial.ipynb next to this script.
"""

import sys
from pathlib import Path

import nbformat
from nbclient import NotebookClient

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("tutorial.ipynb")
nb = nbformat.read(path, as_version=4)
NotebookClient(
    nb,
    kernel_name="python3",
    record_timing=False,
    timeout=600,
    resources={"metadata": {"path": str(path.parent)}},
).execute()

for cell in nb.cells:
    cell.metadata.pop("execution", None)
nb.metadata.get("language_info", {}).pop("version", None)
nbformat.write(nb, path)
