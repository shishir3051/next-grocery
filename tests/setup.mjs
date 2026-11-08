// Registers the alias hooks before any test file is loaded (see alias-hooks.mjs).
import { register } from "node:module";

register("./alias-hooks.mjs", import.meta.url);
