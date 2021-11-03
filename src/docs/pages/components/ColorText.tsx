import React, { useEffect } from "react";
import { Box, Button } from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import { Node } from "@mapequation/c3";
import * as d3 from "d3";
import ClipboardJS from "clipboard";

type ColorTextProps = {
  colors: Node[];
  scheme: (n: number) => string;
};

export default function ColorText({ colors, scheme }: ColorTextProps) {
  const toHex = (color: number) => d3.color(scheme(color))?.hex();

  useEffect(() => {
    new ClipboardJS(".copy-button", {
      text() {
        return (
          "[" + colors.map((c) => '"' + toHex(c.start) + '"').join(", ") + "]"
        );
      },
    });
  }, []);

  return (
    <>
      <Box
        align="left"
        w="100%"
        fontFamily="monospace"
        fontSize="md"
        p={4}
        mt={10}
        borderRadius={5}
        borderWidth={2}
        borderColor="gray.100"
        shadow="sm"
        bg="gray.50"
        color="gray.700"
      >
        [
        {colors.map((c, i) => (
          <React.Fragment key={i}>
            "<span style={{ color: scheme(c.start) }}>{toHex(c.start)}</span>"
            {i + 1 < colors.length && ", "}
          </React.Fragment>
        ))}
        ]
      </Box>
      <Button
        size="sm"
        className="copy-button"
        mt={4}
        colorScheme="blue"
        leftIcon={<CopyIcon />}
      >
        Copy to clipboard
      </Button>
    </>
  );
}
