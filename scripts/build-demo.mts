// Pack the demo/ directory into public/_demo
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const demoDir = join(root, 'demo');
const outDir = join(root, 'public');
const outFile = join(outDir, '_demo');

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = await walk(demoDir);

if (allFiles.length === 0) {
  console.error('[demo:zip] \"demo/\" folder is empty, no files to zip');
  process.exit(1);
}

const zipData: Record<string, Uint8Array> = {};
for (const file of allFiles) {
  const rel = relative(demoDir, file).replace(/\\/g, '/');
  const buf = await readFile(file);
  zipData[rel] = new Uint8Array(buf);
}

const zipped = zipSync(zipData);
await mkdir(outDir, { recursive: true });
await writeFile(outFile, zipped);

console.log(`[demo:zip] Generated "public/_demo" (${allFiles.length} files, ${zipped.length} bytes)`);
