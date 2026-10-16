"""Checks on the committed tutorial notebook, without running it."""

import json
from pathlib import Path

NOTEBOOK = Path(__file__).resolve().parents[1] / "examples" / "tutorial.ipynb"

# What the docs site renders: SVG figures, short text results and printed output
ALLOWED_DATA = {"image/svg+xml", "text/plain"}


def code_cells():
    return [cell for cell in json.loads(NOTEBOOK.read_text())["cells"] if cell["cell_type"] == "code"]


def test_tutorial_is_executed_in_order_without_errors():
    cells = code_cells()
    assert [cell["execution_count"] for cell in cells] == list(range(1, len(cells) + 1))
    for cell in cells:
        for output in cell["outputs"]:
            assert output["output_type"] != "error", cell["source"]


def test_tutorial_outputs_are_svg_text_or_stdout():
    figures = 0
    for cell in code_cells():
        for output in cell["outputs"]:
            if output["output_type"] == "stream":
                assert output["name"] == "stdout", cell["source"]
            else:
                assert set(output["data"]) <= ALLOWED_DATA, cell["source"]
                figures += "image/svg+xml" in output["data"]
    assert figures > 0
