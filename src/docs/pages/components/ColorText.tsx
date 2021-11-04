import React, { useEffect, useCallback } from "react";
import { Box, Button } from "@chakra-ui/react";
import { CopyIcon } from "@chakra-ui/icons";
import type { Interval } from "@mapequation/c3";
import * as d3 from "d3";
import ClipboardJS from "clipboard";

type ColorTextProps = {
  intervals: Interval[];
  scheme: (n: number) => string;
};

export default function ColorText({ intervals = [], scheme }: ColorTextProps) {
  const toHex = useCallback(
    (color: number) => d3.color(scheme(color))?.formatHex(),
    [scheme],
  );

  useEffect(() => {
    new ClipboardJS(".copy-button", {
      text() {
        return (
          "[" +
          intervals.map((c) => '"' + toHex(c.start) + '"').join(", ") +
          "]"
        );
      },
    });
  }, [intervals, toHex]);

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
        {intervals.map((c, i) => (
          <React.Fragment key={i}>
            &quot;
            <span style={{ color: scheme(c.start) }}>{toHex(c.start)}</span>
            &quot;
            {i + 1 < intervals.length && ", "}
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
    intervals: [],
    scheme: () => "red",
  };
};
