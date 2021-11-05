import type { NextPage } from "next";
import Head from "next/head";
import App from "App";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>C3 - Consistent Categorical Colors</title>
        <meta name="description" content="C3 - Consistent Categorical Colors" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <App />
    </div>
  );
};

export default Home;
