import { useState, ReactChildren, ReactChild } from "react";
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
  Flex,
} from "@chakra-ui/react";
import {
  IoSpeedometer,
  IoColorPalette,
  IoBarChart,
  IoShuffle,
  IoInfinite,
} from "react-icons/io5";
import type { IconType } from "react-icons";
import type { NextPage } from "next";
import Head from "next/head";
import * as d3 from "d3";
import * as c3 from "@mapequation/c3";
//import ColorLinear from "./components/ColorLinear";
import ColorWheel from "./components/ColorWheel";
import ColorText from "./components/ColorText";
import ColorBar from "./components/ColorBar";
import SliderInput from "./components/SliderInput";

type FeatureListItemProps = {
  label: string;
  icon: IconType;
  iconColor?: string;
  children: ReactChild | ReactChild[] | ReactChildren | ReactChildren[];
};
const FeatureListItem = ({
  label,
  icon,
  children,
  iconColor = "black",
}: FeatureListItemProps) => (
  <ListItem display="flex" alignItems="center">
    <ListIcon w={10} h={10} as={icon} color={iconColor} />
    <Flex direction="column" ml={2}>
      <Text as="strong">{label}</Text>
      <Text as="div" color="gray.600">
        {children}
      </Text>
    </Flex>
  </ListItem>
);

const Home: NextPage = () => {
  const [numColors, setNumColors] = useState(6);
  const [saturation, setSaturation] = useState(0.8);
  const [lightness, setLightness] = useState(0.6);
  const [schemeName, setSchemeName] =
    useState<keyof typeof d3>("interpolateSinebow");

  const intervals = c3.stops(numColors);

  let scheme = d3[schemeName] as typeof d3.interpolateSinebow;

  const withSaturationLightness = (s: typeof scheme) => {
    return (color: number) => {
      if (schemeName === "interpolateGreys") return s(color);
      const c = d3.hsl(s(color));
      c.s = saturation;
      c.l = lightness;
      return c?.rgb().toString() ?? "red";
    };
  };

  scheme = withSaturationLightness(scheme);

  return (
    <div>
      <Head>
        <title>C3 - Consistent Categorical Colors</title>
        <meta name="description" content="C3 - Consistent Categorical Colors" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container as="header" maxWidth="100%">
        <Container centerContent mb={12} py={6}>
          <HStack>
            <Box mr={6}>
              <Heading
                fontSize="120px"
                letterSpacing="-28px"
                style={{
                  textShadow:
                    "-1px -1px 0 #eee, 1px -1px 0 #eee, -1px 1px 0 #eee, 1px 1px 0 #eee",
                }}
              >
                C3
              </Heading>
            </Box>
            <VStack align="flex-start" spacing="-1" fontSize="lg">
              <Heading fontFamily="inherit">
                C
                <Text as="span" color="gray.400">
                  onsistent
                </Text>
              </Heading>
              <Heading fontFamily="inherit">
                C
                <Text as="span" color="gray.400">
                  ategorical
                </Text>
              </Heading>
              <Heading fontFamily="inherit">
                C
                <Text as="span" color="gray.400">
                  olors
                </Text>
              </Heading>
            </VStack>
          </HStack>
          <Text my={4} fontSize="3xl" color="gray.400">
            Deterministic colors for maps
          </Text>
        </Container>
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
          <ColorWheel intervals={intervals} scheme={scheme} size={500} />
        </Box>

        <Box align="center" mt="10">
          <ColorBar intervals={intervals} scheme={scheme} />
        </Box>

        <Box mt={10}>
          <SliderInput
            min={2}
            max={128}
            value={numColors}
            onChange={setNumColors}
            suffix="colors"
          />
          <Flex mt={4}>
            <Slider
              focusThumbOnChange={false}
              value={saturation}
              onChange={setSaturation}
              min={0}
              max={1}
              step={0.1}
              disabled={schemeName === "interpolateGreys"}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize="sm" boxSize="32px">
                {saturation}
              </SliderThumb>
            </Slider>
            <Box mx={10}>Saturation</Box>
          </Flex>
          <Flex mt={4}>
            <Slider
              focusThumbOnChange={false}
              value={lightness}
              onChange={setLightness}
              min={0}
              max={1}
              step={0.1}
              disabled={schemeName === "interpolateGreys"}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize="sm" boxSize="32px">
                {lightness}
              </SliderThumb>
            </Slider>
            <Box mx={10}>Lightness</Box>
          </Flex>
        </Box>

        {/* <ColorLinear intervals={intervals} scheme={scheme} /> */}

        <Box align="center" mt={14}>
          <ColorText intervals={intervals} scheme={scheme} />
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

        <List mt={4} spacing="5">
          <FeatureListItem
            label="Unlimited colors"
            icon={IoInfinite}
            iconColor="gray.400"
          >
            Generate as many colors you want
          </FeatureListItem>
          <FeatureListItem
            label="Any color scheme"
            icon={IoColorPalette}
            iconColor="yellow.400"
          >
            We generate color stops on the interval [0,&nbsp;1]. Perfect to use
            with <a href="https://github.com/d3/d3-scale-chromatic">d3</a>.
          </FeatureListItem>

          <FeatureListItem
            label="Deterministic"
            icon={IoShuffle}
            iconColor="red.600"
          >
            You always get the same colors for the same requested number of
            colors.
          </FeatureListItem>
          <FeatureListItem
            label="Consistent"
            icon={IoBarChart}
            iconColor="green.600"
          >
            If you increase the number of colors, it doesn&apos;t change the
            list of colors you already have.
          </FeatureListItem>
          <FeatureListItem
            label="Fast"
            icon={IoSpeedometer}
            iconColor="blue.500"
          >
            The complexity is O(n log(n)) for n colors.
          </FeatureListItem>
        </List>

        <Heading mt={12}>Authors</Heading>

        <Text mt={4} mb={20}>
          Daniel Edler, Anton Eriksson
        </Text>
      </Container>
    </div>
  );
};

export default Home;
