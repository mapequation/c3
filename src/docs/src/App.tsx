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
  Switch,
  FormControl,
  FormLabel,
  Spacer,
} from "@chakra-ui/react";
import {
  IoSpeedometer,
  IoColorPalette,
  IoBarChart,
  IoShuffle,
  IoInfinite,
} from "react-icons/io5";
import type { IconType } from "react-icons";
import * as d3 from "d3";
import * as c3 from "@mapequation/c3";
import ColorWheel from "components/ColorWheel";
import ColorText from "components/ColorText";
import ColorBar from "components/ColorBar";
import SliderInput from "components/SliderInput";
import ColorLinear from "components/ColorLinear";

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

const methods = {
  stops: c3.stops,
  weightedStops: c3.weightedStops,
} as const;

export default function App() {
  const [numColors, setNumColors] = useState(6);
  const [method, setMethod] = useState<keyof typeof methods>("stops");
  const [saturation, setSaturation] = useState(0.8);
  const [offset, setOffset] = useState(0);
  const [lightness, setLightness] = useState(0.6);
  const [skewness, setSkewness] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [schemeName, setSchemeName] =
    useState<keyof typeof d3>("interpolateSinebow");

  const weights = d3
    .range(numColors)
    .map((_, i) => Math.exp((skewness * 5 * (numColors - i)) / numColors ** 1));

  const intervals =
    method === "weightedStops"
      ? c3.weightedStops(weights)
      : c3.stops(numColors);

  let scheme = d3[schemeName] as typeof d3.interpolateSinebow;

  const withSaturationLightness = (s: typeof scheme) => {
    return (color: number) => {
      color = color + offset - Math.floor(color + offset);
      if (reverse) color = 1 - color;
      if (schemeName === "interpolateGreys") return s(color);
      const c = d3.hsl(s(color));
      c.s = saturation;
      c.l = lightness;
      return c.toString();
    };
  };

  scheme = withSaturationLightness(scheme);

  return (
    <div>
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
          <HStack>
            <Select
              id="colorScale"
              value={schemeName}
              onChange={(e) =>
                setSchemeName(e.target?.value! as keyof typeof d3)
              }
            >
              <option value="interpolateSinebow">Sinebow</option>
              <option value="interpolateRainbow">Rainbow</option>
              <option value="interpolateTurbo">Turbo</option>
              <option value="interpolateViridis">Viridis</option>
              <option value="interpolateGreys">Greys</option>
            </Select>
            <Spacer />
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="reverse" mb="0">
                Reverse
              </FormLabel>
              <Switch
                id="reverse"
                isChecked={reverse}
                onChange={() => setReverse(!reverse)}
              />
            </FormControl>
          </HStack>

          <Select
            mt={4}
            value={method}
            onChange={(e) =>
              setMethod(e.target?.value! as keyof typeof methods)
            }
          >
            <option value="stops">Standard</option>
            <option value="weightedStops">Leapfrog</option>
          </Select>
        </Box>

        <Box align="center">
          <ColorWheel intervals={intervals} scheme={scheme} size={500} />
        </Box>

        <Box align="center" mt="10">
          <ColorBar intervals={intervals} scheme={scheme} weights={weights} />
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
          <Flex mt={4}>
            <Slider
              focusThumbOnChange={false}
              value={skewness}
              onChange={setSkewness}
              min={0}
              max={1}
              step={0.1}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize="sm" boxSize="32px">
                {skewness}
              </SliderThumb>
            </Slider>
            <Box mx={10}>Skewness</Box>
          </Flex>
          <Flex mt={4}>
            <Slider
              focusThumbOnChange={false}
              value={offset}
              onChange={setOffset}
              min={0}
              max={1}
              step={0.01}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize="sm" boxSize="32px">
                {offset}
              </SliderThumb>
            </Slider>
            <Box mx={14}>Offset</Box>
          </Flex>
        </Box>

        <Box mt={8}>
          <ColorLinear
            height={300}
            numColors={intervals.length}
            scheme={scheme}
            cantor={method === "stops"}
          />
        </Box>

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
}
