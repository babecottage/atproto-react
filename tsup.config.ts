import { Options, defineConfig } from "tsup";

export const commonConfig: Options = {
  clean: true,
  dts: true,
  external: ["react"],
  format: ["cjs", "esm"],
  minify: true,
  sourcemap: true,
};

export default defineConfig([
  {
    ...commonConfig,
    entry: ["src/index.ts"],
    outDir: "dist",
  },
  {
    ...commonConfig,
    entry: ["src/client/index.ts"],
    outDir: "client",
    esbuildOptions: (options) => {
      options.banner = {
        js: '"use client";',
      };
    },
  },
]);
