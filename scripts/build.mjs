import fs from "node:fs/promises";
import path from "node:path";

const packageRoot = path.resolve(import.meta.dirname, "..");

await assertExists(path.join(packageRoot, "package.json"));
await assertExists(path.join(packageRoot, "bin", "flow-sdd.js"));
await assertExists(path.join(packageRoot, "src", "cli.mjs"));
await assertExists(path.join(packageRoot, "skills-src"));

console.log("build check passed");

async function assertExists(targetPath) {
  try {
    await fs.access(targetPath);
  } catch {
    throw new Error(`Missing required package artifact: ${targetPath}`);
  }
}
