import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  source: {
    entry: { example: "./example/index.tsx" },
  },
  output: { distPath: { root: "dist-example" } },
  html: {
    template: "./example/index.html",
  },
  server: {
    port: 3000,
  },
  plugins: [pluginReact()],
});
