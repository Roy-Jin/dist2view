// 将 demo/ 目录打包为 public/demo.zip
// 使用 fflate（项目已有依赖），无需任何外部 CLI 工具
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const demoDir = join(root, 'demo');
const outDir = join(root, 'public');
const outFile = join(outDir, 'demo.zip');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
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
  console.error('[demo:zip] demo/ 目录为空，未生成 demo.zip');
  process.exit(1);
}

const zipData = {};
for (const file of allFiles) {
  // 扁平化路径：去掉 demo/ 前缀，使 index.html 位于 zip 根目录
  // 同时把 Windows 反斜杠归一化为正斜杠
  const rel = relative(demoDir, file).replace(/\\/g, '/');
  const buf = await readFile(file);
  zipData[rel] = new Uint8Array(buf);
}

const zipped = zipSync(zipData);
await mkdir(outDir, { recursive: true });
await writeFile(outFile, zipped);

console.log(`[demo:zip] 已生成 public/demo.zip (${allFiles.length} 个文件, ${zipped.length} 字节)`);
