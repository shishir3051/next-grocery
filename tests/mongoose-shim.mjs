// mongoose is CommonJS, and Node can't see its named exports from ES modules, so src/
// files that do `import { Schema, model } from "mongoose"` load it through this shim in tests.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");

export default mongoose;
export const { Schema, Document, Types, models, isObjectIdOrHexString } = mongoose;
export const model = mongoose.model.bind(mongoose);
