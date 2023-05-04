import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],

  // treeshake: true,
  minify: true,
  esbuildOptions: (options) => {
    options.banner = {
      js: '"use client";',
    };
  },
  clean: true,
  dts: true,
  splitting: false,
  format: ["cjs", "esm"],
  external: ["react"],
  sourcemap: "inline",
});
