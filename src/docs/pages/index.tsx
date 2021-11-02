import { useState } from "react";
import {
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Select,
  Box,
  Container,
  Heading,
} from "@chakra-ui/react";
import type { NextPage } from "next";
import Head from "next/head";
import * as d3 from "d3";
import { generateArray } from "@mapequation/c3";
import ColorLinear from "./components/ColorLinear";
import ColorWheel from "./components/ColorWheel";
import ColorText from "./components/ColorText";

const Home: NextPage = () => {
  const [numColors, setNumColors] = useState(8);
  const [schemeName, setSchemeName] = useState("interpolateSinebow");
  const colors = generateArray(numColors);

  // @ts-ignore
  const scheme = d3[schemeName]!;

  return (
    <div>
      <Head>
        <title>C3 - Categorical Cantor Colors</title>
        <meta name="description" content="C3 - Categorical Cantor Colors" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container as="main" centerContent my={12}>
        <Heading size="xl">C3 - Categorical Cantor Colors</Heading>

        <p>
          Deterministic hierarchical colors for maps. Inspired by the Cantor set
          fractal.
        </p>

        <Box>
          <Select
            id="colorScale"
            value={schemeName}
            onChange={(e) => setSchemeName(e.target?.value)}
          >
            <option value="interpolateSinebow">Sinebow</option>
            <option value="interpolateRainbow">Rainbow</option>
          </Select>
        </Box>

        <Box w="500px">
          <Slider
            id="numColors"
            aria-label="num-colors"
            defaultValue={numColors}
            min={2}
            step={1}
            max={32}
            onChange={(value) => setNumColors(value)}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
        </Box>

        <p>{numColors} colors</p>

        <ColorWheel colors={colors} scheme={scheme} />

        <ColorLinear colors={colors} scheme={scheme} />

        <ColorText colors={colors} scheme={scheme} />
      </Container>
    </div>
  );
};

export default Home;
