import React, { useEffect, useCallback } from "react";
import { Box, Button } from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import * as d3 from "d3";
import ClipboardJS from "clipboard";

type ColorTextProps = {
  colors: string[];
};

export default function ColorText({ colors = [] }: ColorTextProps) {
  const toHex = useCallback(
    (color: string) => d3.color(color)?.formatHex(),
    [],
  );

  useEffect(() => {
    new ClipboardJS(".copy-button", {
      text() {
        return `[${colors.map((c) => `"${toHex(c)}"`).join(", ")}]`;
      },
    });
  }, [colors, toHex]);

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
        {colors.map((color, i) => (
          <React.Fragment key={i}>
            &quot;
            <span style={{ color }}>{toHex(color)}</span>
            &quot;
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

ColorText.getInitialProps = function () {
  return {
    colors: [],
  };
};
