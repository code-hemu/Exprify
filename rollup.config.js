import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.js",
  output: [
    {
      file: "dist/exprify.esm.js",
      format: "esm", // ES Module
      sourcemap: true
    },
    {
      file: "dist/exprify.cjs.js",
      format: "cjs", // CommonJS for Node
      sourcemap: true
    },
    {
      file: "dist/exprify.umd.js",
      format: "umd", // Browser global
      name: "exprify",
      sourcemap: true
    }
  ],
  plugins: [resolve(), commonjs(), terser()]
};

