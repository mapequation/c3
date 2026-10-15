import { palette } from "@mapequation/c3";
import { defaultPaletteOptions, vanDerCorput } from "@mapequation/c3/internal";

const COUNT = 8;
const { lightnessOffset, chromaOffset } = defaultPaletteOptions;

/** vanDerCorput(i, base) as a fraction: mirroring d digits gives base^d as the denominator */
function fraction(i: number, base: number) {
  if (i === 0) return "0";
  let denominator = 1;
  for (let rest = i; rest > 0; rest = Math.floor(rest / base)) denominator *= base;
  return `${Math.round(vanDerCorput(i, base) * denominator)}/${denominator}`;
}

const rows = palette(COUNT).map((color, i) => ({
  color,
  hue: fraction(i, 2),
  lightness: fraction(i + lightnessOffset, 3),
  chroma: fraction(i + chromaOffset, 5),
}));

export function HowItWorks() {
  return (
    <section className="how" aria-labelledby="how-it-works">
      <h2 id="how-it-works">How it works</h2>
      <div className="how-body">
        <div className="how-text">
          <p>
            Every palette is drawn from one fixed, endless list of colors. That is why the same request always gives the
            same colors, and asking for more never changes the ones you have.
          </p>
          <p>
            Color number <var>i</var>, counting from 0, gets three numbers between 0 and 1 from{" "}
            <a href="https://en.wikipedia.org/wiki/Van_der_Corput_sequence">van der Corput sequences</a>: write{" "}
            <var>i</var> in a base and mirror its digits around the decimal point. For example, 6 is 110 in base 2 and becomes 0.011, which
            is 3/8.
          </p>
          <ul>
            <li>
              <strong>Hue</strong> uses base 2: 0, 1/2, 1/4, 3/4, 1/8, … Each round fills the middle of every gap, like
              the halving steps of the <a href="https://en.wikipedia.org/wiki/Cantor_set">Cantor set</a>, and consecutive
              colors land far apart. These are the Cantor stops, placed on the OKLCH hue circle or along a d3 color
              scheme.
            </li>
            <li>
              <strong>Lightness</strong> uses base 3: 0, 1/3, 2/3, 1/9, 4/9, …, scaled into the lightness range.
            </li>
            <li>
              <strong>Chroma</strong>, how colorful a color is (0 is grey), uses base 5, scaled into the chroma range.
            </li>
          </ul>
          <p>
            Different prime bases keep the three from lining up. Together they form a{" "}
            <a href="https://en.wikipedia.org/wiki/Halton_sequence">Halton sequence</a>, which spreads the colors evenly
            over all hues and through both ranges.
          </p>
          <p>
            <a href="https://bottosson.github.io/posts/oklab/">OKLCH</a> is a color space where equal steps look about
            equally different. Distances between colors are measured in its sibling OKLab, where 0.02 is about the smallest
            difference you can see.
          </p>
          <p>
            <strong>Choosing colors by distance.</strong> Taking the sequence in order is fast, but two colors can land
            close by chance. Instead, each color can be the candidate whose closest already chosen color is farthest away.
            The candidates are the first 4096 colors of the sequence (method <code>"farthest"</code>) or only the next 64
            unused ones (<code>"lookahead"</code>). Seeds are colors chosen before the first pick, so new colors land as far
            from them as possible. Each choice depends only on the colors before it, so this stays deterministic and
            consistent.
          </p>
          <p>
            <strong>Nested modules.</strong> <code>hierarchy()</code> colors the top modules with <code>palette()</code>,
            weighted by flow. Each module then gets a ball in OKLab: all colors within a radius of its color. For every
            other module on the same level, the distance between the two is split in proportion to the square roots of their
            flows; the radius is the smallest of these shares, made 20% smaller (<code>padding</code>) so balls never touch.
            The children are chosen inside the ball, each as far as possible from its siblings. So they look like their
            parent, differ from each other, and stay apart from their cousins, and a large module has room for many
            children. The Hierarchy tab above shows the balls.
          </p>
        </div>

        <figure className="halton">
          <table>
            <thead>
              <tr>
                <th scope="col">Color</th>
                <th scope="col">
                  Hue <span>base 2</span>
                </th>
                <th scope="col">
                  Lightness <span>base 3</span>
                </th>
                <th scope="col">
                  Chroma <span>base 5</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ color, hue, lightness, chroma }, i) => (
                <tr key={i}>
                  <th scope="row">
                    <span className="halton-swatch" style={{ background: color }} title={color} />
                    {i}
                  </th>
                  <td>{hue}</td>
                  <td>{lightness}</td>
                  <td>{chroma}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <figcaption>
            The first {COUNT} colors of <code>palette()</code>. By default it starts lightness {lightnessOffset} and chroma{" "}
            {chromaOffset} steps into their sequences (<code>lightnessOffset</code>, <code>chromaOffset</code>).
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
