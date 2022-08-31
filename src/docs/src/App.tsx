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
  Stack,
  Link,
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
import ColorCantor from "components/ColorCantor";
import type { SchemeName } from "@mapequation/c3";

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

export function modifyScheme(
  scheme: typeof d3.interpolateSinebow,
  {
    saturation,
    lightness,
    offset,
    reverse,
  }: {
    saturation?: number;
    lightness?: number;
    offset?: number;
    reverse?: boolean;
  } = {},
) {
  return (t: number) => {
    offset ??= 0;
    t = t + offset - Math.floor(t + offset);
    if (reverse) t = 1 - t;
    const c = d3.hsl(scheme(t));
    if (saturation) {
      c.s = saturation;
    }
    if (lightness) {
      c.l = lightness;
    }
    return c.toString();
  };
}

export default function App() {
  const [numColors, setNumColors] = useState(8);
  const [saturation, setSaturation] = useState(0.55);
  const [saturationEnd, setSaturationEnd] = useState(0.8);
  const [lightness, setLightness] = useState(0.5);
  const [lightnessEnd, setLightnessEnd] = useState(0.9);
  const [midpoint, setMidpoint] = useState(4.5);
  const [steepness, setSteepness] = useState(1);
  const [skewness, setSkewness] = useState(0);
  const [strength, setStrength] = useState(1);
  const [offset, setOffset] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [schemeName, setSchemeName] =
    useState<keyof typeof d3>("interpolateSinebow");

  const isGreyScale = schemeName === "interpolateGreys";

  const _saturation = isGreyScale ? undefined : saturation;
  const _lightness = isGreyScale ? undefined : lightness;
  const _saturationEnd = isGreyScale ? undefined : saturationEnd;
  const _lightnessEnd = isGreyScale ? undefined : lightnessEnd;

  const weights = c3.getDefaultWeights(numColors, skewness);

  const intervals = c3.stops(weights, { strength });
  const colors = c3.colors(intervals, {
    scheme: schemeName.slice("interpolate".length) as SchemeName,
    saturation: _saturation,
    lightness: _lightness,
    saturationEnd: _saturationEnd,
    lightnessEnd: _lightnessEnd,
    midpoint,
    steepness,
    skewness,
    strength,
    offset,
    reverse,
  });

  let scheme = d3[schemeName] as typeof d3.interpolateSinebow;

  scheme = modifyScheme(scheme, {
    saturation: _saturation,
    lightness: _lightness,
    offset,
    reverse,
  });

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
          <Text mt={4} fontSize="3xl" color="gray.400">
            Deterministic colors for maps
          </Text>
          <Text mt={1} fontSize="3xl" color="gray.400">
            Inspired by the{" "}
            <Link href="https://en.wikipedia.org/wiki/Cantor_set" isExternal>
              Cantor set
            </Link>{" "}
            fractal
          </Text>
        </Container>
      </Container>

      <Container as="main" my={12}>
        <Stack
          align="center"
          justify="center"
          direction={["column", "row"]}
          spacing="24px"
          mt={4}
        >
          <ColorWheel intervals={intervals} scheme={scheme} size={300} />
          <ColorCantor
            height={300}
            width={300}
            weights={weights}
            strength={strength}
            scheme={scheme}
            saturation={saturation}
            lightness={lightness}
            saturationEnd={saturationEnd}
            lightnessEnd={lightnessEnd}
            midpoint={midpoint}
            steepness={steepness}
            skipModifyScheme={isGreyScale}
          />
        </Stack>

        <Box align="center" mt="10">
          <ColorBar colors={colors} />
        </Box>

        <Box mt={10}>
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
          <SliderInput
            min={2}
            max={256}
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
              step={0.01}
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
              value={saturationEnd}
              onChange={setSaturationEnd}
              min={0}
              max={1}
              step={0.01}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize="sm" boxSize="32px">
                {saturationEnd}
              </SliderThumb>
            </Slider>
            <Box mx={10}>Saturation end</Box>
          </Flex>
          <Flex mt={4}>
            <Slider
              focusThumbOnChange={false}
              value={lightness}
              onChange={setLightness}
              min={0}
              max={1}
              step={0.01}
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
              value={lightnessEnd}
              onChange={setLightnessEnd}
              min={0}
              max={1}
              step={0.01}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize="sm" boxSize="32px">
                {lightnessEnd}
              </SliderThumb>
            </Slider>
            <Box mx={10}>Lightness end</Box>
          </Flex>
          <Flex mt={4}>
            <Slider
              focusThumbOnChange={false}
              value={midpoint}
              onChange={setMidpoint}
              min={0}
              max={8}
              step={0.1}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize="sm" boxSize="32px">
                {midpoint}
              </SliderThumb>
            </Slider>
            <Box mx={10}>Midpoint</Box>
          </Flex>
          <Flex mt={4}>
            <Slider
              focusThumbOnChange={false}
              value={steepness}
              onChange={setSteepness}
              min={0}
              max={5}
              step={0.1}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize="sm" boxSize="32px">
                {steepness}
              </SliderThumb>
            </Slider>
            <Box mx={10}>Steepness</Box>
          </Flex>
          <Flex mt={4}>
            <Slider
              focusThumbOnChange={false}
              value={skewness}
              onChange={setSkewness}
              min={0}
              max={1}
              step={0.01}
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
          <Flex mt={4} display="none">
            <Slider
              focusThumbOnChange={false}
              value={strength}
              onChange={setStrength}
              min={0}
              max={1}
              step={0.01}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb fontSize="sm" boxSize="32px">
                {strength}
              </SliderThumb>
            </Slider>
            <Box mx={10}>Weight strength</Box>
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

        <Box align="center" mt={14}>
          <ColorText colors={colors} />
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
