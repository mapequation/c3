import { Flex } from "@chakra-ui/layout";
import {
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from "@chakra-ui/number-input";
import {
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  SliderProps,
} from "@chakra-ui/slider";

type SliderInputProps = {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
} & SliderProps;

export default function SliderInput({
  value,
  onChange,
  suffix = "",
  min = 2,
  max = 32,
  ...props
}: SliderInputProps) {
  const format = (value: number) => `${value} ${suffix}`;
  const parse = (value: string) => parseInt(value) ?? 0;

  const onChangeStepper = (v: string) => {
    const n = parse(v);
    if (n >= min && n <= max) {
      onChange(n);
    }
  };
  return (
    <Flex>
      <Slider
        flex="1"
        focusThumbOnChange={false}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        {...props}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb fontSize="sm" boxSize="32px">
          {value}
        </SliderThumb>
      </Slider>
      <NumberInput
        maxW="125px"
        ml="2rem"
        value={format(value)}
        onChange={onChangeStepper}
      >
        <NumberInputField isReadOnly />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
    </Flex>
  );
}
