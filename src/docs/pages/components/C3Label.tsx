import { generateArray } from "@mapequation/c3";
import { interpolateRainbow, interpolateSinebow } from "d3";

type C3LabelProps = {
  text: string;
  scheme?: "rainbow" | "sinebow";
};

export default function C3Label({ text, scheme = "sinebow" }: C3LabelProps) {
  const colors = generateArray(text.length);
  const interpolateColor =
    scheme === "rainbow" ? interpolateRainbow : interpolateSinebow;

  return (
    <>
      {text.split("").map((letter, i) => (
        <span
          key={i}
          style={{
            color: interpolateColor(colors[i].start),
            WebkitTextStroke: "0.2px #333333",
          }}
        >
          {letter}
        </span>
      ))}
    </>
  );
}
