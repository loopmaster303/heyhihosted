import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    ignores: ["dist/**", "coverage/**", "tmp-npm-cache/**"],
  },
];

export default config;
