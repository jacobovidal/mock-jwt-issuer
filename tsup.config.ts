import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: [
      "api/index.ts",
    ],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    minify: true,
    clean: true,
    treeshake: true,
    target: "esnext",
  },
]);
