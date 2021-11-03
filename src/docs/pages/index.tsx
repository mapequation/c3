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
  Text,
  HStack,
  VStack,
  List,
  ListItem,
  ListIcon,
  Code,
} from "@chakra-ui/react";
import {
  IoSpeedometer,
  IoColorPalette,
  IoBarChart,
  IoShuffle,
  IoInfinite,
} from "react-icons/io5";
import type { NextPage } from "next";
import Head from "next/head";
import * as d3 from "d3";
import { generateArray } from "@mapequation/c3";
import ColorLinear from "./components/ColorLinear";
import ColorWheel from "./components/ColorWheel";
import ColorText from "./components/ColorText";
import ColorBar from "./components/ColorBar";
import C3Label from "./components/C3Label";
import SliderInput from "./components/SliderInput";

const Home: NextPage = () => {
  const [numColors, setNumColors] = useState(8);
  const [schemeName, setSchemeName] =
    useState<keyof typeof d3>("interpolateSinebow");
  const colors = generateArray(numColors);

  const scheme = d3[schemeName] as typeof d3.interpolateSinebow;

  return (
    <div>
      <Head>
        <title>C3 - Consistent Categorical Colors</title>
        <meta name="description" content="C3 - Consistent Categorical Colors" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container as="header" centerContent my={12}>
        <HStack>
          <Box mr={6}>
            <Heading size="4xl" letterSpacing="-17px">
              C3
            </Heading>
          </Box>
          <VStack
            align="flex-start"
            spacing="-1"
            fontFamily="Menlo, Consolas, monospace"
          >
            <Heading size="md" fontFamily="inherit">
              <C3Label text="Consistent" />
            </Heading>
            <Heading size="md" fontFamily="inherit">
              <C3Label text="Categorical" />
            </Heading>
            <Heading size="md" fontFamily="inherit">
              <C3Label text="Colors" />
            </Heading>
          </VStack>
        </HStack>

        <Text my={4}>
          Deterministic colors for maps.
          <br />
          Inspired by the{" "}
          <a href="//en.wikipedia.org/wiki/Cantor_set">Cantor set fractal</a>.
        </Text>
      </Container>

      <Container as="main" my={12}>
        <Box>
          <Select
            id="colorScale"
            value={schemeName}
            onChange={(e) => setSchemeName(e.target?.value! as keyof typeof d3)}
          >
            <option value="interpolateSinebow">Sinebow</option>
            <option value="interpolateRainbow">Rainbow</option>
            <option value="interpolateTurbo">Turbo</option>
            <option value="interpolateViridis">Viridis</option>
            <option value="interpolateGreys">Greys</option>
          </Select>
        </Box>

        <Box align="center">
          <ColorWheel colors={colors} scheme={scheme} size={500} />
        </Box>

        <Box align="center" mt="10">
          <ColorBar colors={colors} scheme={scheme} />
        </Box>

        <Box mt={10}>
          <SliderInput
            value={numColors}
            onChange={setNumColors}
            suffix="colors"
          />
        </Box>

        {/* <ColorLinear colors={colors} scheme={scheme} /> */}

        <Box align="center" mt={14}>
          <ColorText colors={colors} scheme={scheme} />
        </Box>

        <Heading mt={12}>Install</Heading>

        <Text my={4}>Install from NPM</Text>

        <Code variant="solid" px={3} py={2}>
          npm install @mapequation/c3
        </Code>

        <Text my={4}>
          Source code is available on{" "}
          <a href="//github.com/mapequation/c3">GitHub</a>.
        </Text>

        <Heading mt={12}>Features</Heading>

        <List mt={4} mb={20}>
          <ListItem>
            <ListIcon as={IoInfinite} />
            <strong>Unlimited colors</strong> Generate as many colors you want
          </ListItem>
          <ListItem>
            <ListIcon as={IoColorPalette} color="green.400" />
            <strong>Any color scheme</strong> We generate color stops on the
            interval <code>[0, 1]</code>. Perfect to use with{" "}
            <a href="https://github.com/d3/d3-scale-chromatic">d3</a>.
          </ListItem>
          <ListItem>
            <ListIcon as={IoShuffle} color="red.500" />
            <strong>Deterministic</strong> You always get the same colors for
            the same requested number of colors.
          </ListItem>
          <ListItem>
            <ListIcon as={IoBarChart} />
            <strong>Consistent</strong> If you increase the number of colors, it
            doesn't change the list of colors you already have.
          </ListItem>
          <ListItem>
            <ListIcon as={IoSpeedometer} color="blue.500" />
            <strong>Fast</strong> The complexity is O(n log(n)) for n colors.
          </ListItem>
        </List>
      </Container>
    </div>
  );
};

export default Home;
