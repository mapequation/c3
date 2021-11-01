import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import * as d3 from "d3";
import { generateArray } from "@mapequation/c3";

const scheme = d3.interpolateSinebow;
const colors = generateArray(10);

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>C3 - Categorical Cantor Colors</title>
        <meta name="description" content="C3 - Categorical Cantor Colors" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>C3 - Categorical Cantor Colors</h1>

        <p className={styles.description}>
          Deterministic hierarchical colors for maps. Inspired by the Cantor set
          fractal.
        </p>

        <div>
          {colors.map((color, i) => (
            <div
              key={i}
              style={{
                display: "inline-block",
                width: `${color.size * 500}px`,
                height: "100px",
                background: scheme(i / colors.length),
              }}
            />
          ))}
        </div>
        <div>
          {colors.map((color, i) => (
            <div
              key={i}
              style={{
                display: "inline-block",
                width: `${color.size * 500}px`,
                height: "100px",
                background: scheme(color.start),
              }}
            />
          ))}
        </div>
      </main>

      <footer className={styles.footer}></footer>
    </div>
  );
};

export default Home;
