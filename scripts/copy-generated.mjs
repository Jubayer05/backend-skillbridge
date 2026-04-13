/**
 * tsc emits only compiled .ts files; Prisma's client under src/generated is
 * pre-built JS/WASM and must be copied into dist/ so dist/lib/prisma.js can resolve it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src", "generated");
const dest = path.join(root, "dist", "generated");

if (!fs.existsSync(src)) {
  console.error("copy-generated: missing", src, "— run prisma generate");
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });
console.log("copy-generated: src/generated → dist/generated");
