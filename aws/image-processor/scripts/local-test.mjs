// Runs the image processing on a local file and writes the results to /tmp, to check the output
// before deploying. Usage: npm run test:local -- <path-to-image>
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { processImage } from "../src/process-image.mjs";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npm run test:local -- <path-to-image>");
  process.exit(1);
}

const outDir = "/tmp/avishkar-variants-test";
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const result = await processImage(await readFile(input));
console.log(`Original: ${result.width}×${result.height}, widths: ${result.widths.join(", ")}`);
for (const file of result.files) {
  const target = path.join(outDir, file.name);
  await writeFile(target, file.data);
  const { width, height } = await sharp(file.data).metadata();
  console.log(`${file.name.padEnd(10)} ${String(width).padStart(5)}×${String(height).padEnd(5)} ${(file.data.length / 1024).toFixed(1)} KB`);
}
console.log(`Written to ${outDir}`);
