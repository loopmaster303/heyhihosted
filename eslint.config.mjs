import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
  {
    ignores: ["dist/**", "coverage/**", "tmp-npm-cache/**"],
  },
  // Warnungen, keine Fehler: sie brechen keinen Build, zeigen aber ab sofort
  // genau die Stellen, an denen ein Klick ohne Tastaturweg haengt. Das Plugin
  // liegt ueber eslint-config-next schon bei — keine neue Abhaengigkeit.
  {
    rules: {
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-tabindex": "warn",
    },
  },
];

export default config;
