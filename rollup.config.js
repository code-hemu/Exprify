import fs from "fs";
import path from "path";

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

import terser from "@rollup/plugin-terser";
import pkg from "./package.json";

const short_banner = `/*! ${pkg.name} v${pkg.version} | * (c) ${new Date().getFullYear()} ${pkg.author} and contributors | ${pkg.license} License*/`;

const banner = `/*!
* ${pkg.name} v${pkg.version}
* (c) ${new Date().getFullYear()} ${pkg.author} and other contributors
*
* Released under the ${pkg.license} License
* Date: ${new Date().toISOString().split('T')[0]}
*/`;

function removeComment() {
  return {
    name: "remove-sourcemap-comment",
    writeBundle(outputOptions, bundle) {
      for (const fileName in bundle) {
        if (fileName.endsWith(".js")) {
          const filePath = path.join(
            outputOptions.dir || path.dirname(outputOptions.file),
            fileName
          );

          let code = fs.readFileSync(filePath, "utf-8");

          code = code.replace(/\/\/# sourceMappingURL=.*$/gm, "");

          fs.writeFileSync(filePath, code);
        }
      }
    }
  };
}

export default [
  {
    input: "src/index.js",
    output: [
      {
        file: "dist/exprify.esm.js",
        format: "esm",
        sourcemap: true
      },
      {
        file: "dist/exprify.cjs.js",
        format: "cjs",
        sourcemap: true,
        exports: "default"
      },
      {
        file: "dist/exprify.js",
        format: "umd",
        name: "Exprify",
        banner: banner,
        sourcemap: true,
        indent: true,
        exports: "default"
      }
    ],
    plugins: [resolve(), commonjs(), removeComment()]
  },
  {
    input: "src/index.js",
    output: {
      file: "dist/exprify.min.js",
      format: "umd",
      name: "Exprify",
      sourcemap: true,
      banner: short_banner
    },
    plugins: [resolve(), commonjs(), terser(), removeComment()]
  }
];