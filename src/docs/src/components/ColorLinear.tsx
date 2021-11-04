import type { Margin } from "../utils/renderUtils";
import ColorCantor from "./ColorCantor";
import ColorLinearWeighted from "./ColorLinearWeighted";

export type ColorProps = {
  numColors: number;
  scheme: (n: number) => string;
  animate?: boolean;
  width?: number;
  height?: number;
  margin?: Margin;
  cantor?: boolean;
};

export default function ColorLinear({
  numColors,
  scheme,
  animate = false,
  width = 500,
  height = 500,
  margin = undefined,
  cantor = true,
}: ColorProps) {
  if (cantor) {
    return (
      <ColorCantor
        numColors={numColors}
        scheme={scheme}
        width={width}
        height={height}
        margin={margin}
      />
    );
  }
  return null;
  // return (
  //   <ColorLinearWeighted
  //     numColors={numColors}
  //     scheme={scheme}
  //     width={width}
  //     height={height}
  //     margin={margin}
  //   />
  // );
}

ColorLinear.getInitialProps = function () {
  return {
    numColors: 0,
    scheme: () => "red",
  };
};
