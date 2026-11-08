// Node module hooks for the test runner: resolve the "@/..." path alias (tsconfig "paths")
// and extensionless TypeScript imports, so tests can load src/ files directly with
// Node's built-in TypeScript support (Node 22.18+), without a bundler or extra packages.
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));
const CANDIDATES = ["", ".ts", ".tsx", "/index.ts"];

function findFile(basePath) {
  for (const suffix of CANDIDATES) {
    const file = basePath + suffix;
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
}

const MONGOOSE_SHIM = new URL("./mongoose-shim.mjs", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "mongoose" && context.parentURL !== MONGOOSE_SHIM) {
    return { url: MONGOOSE_SHIM, format: "module", shortCircuit: true };
  }
  let basePath = null;
  if (specifier.startsWith("@/")) basePath = SRC + specifier.slice(2);
  else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    basePath = fileURLToPath(new URL(specifier, context.parentURL));
  }
  if (basePath) {
    const file = findFile(basePath);
    if (file && /\.tsx?$/.test(file)) {
      return { url: pathToFileURL(file).href, format: "module-typescript", shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
