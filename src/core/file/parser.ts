import * as fflate from 'fflate';
import { VirtualFile } from '../types';

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'pdf',
  'woff', 'woff2', 'ttf', 'otf', 'mp3', 'wav', 'mp4', 'webm',
  'zip', 'tar', 'gz', 'dmg', 'exe', 'bin'
]);

const MIME_TYPES: Record<string, string> = {
  'html': 'text/html; charset=utf-8',
  'htm': 'text/html; charset=utf-8',
  'css': 'text/css; charset=utf-8',
  'js': 'application/javascript; charset=utf-8',
  'mjs': 'application/javascript; charset=utf-8',
  'json': 'application/json; charset=utf-8',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'svg': 'image/svg+xml',
  'ico': 'image/x-icon',
  'webp': 'image/webp',
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mp3': 'audio/mpeg',
  'wav': 'audio/wav',
  'woff': 'font/woff',
  'woff2': 'font/woff2',
  'ttf': 'font/ttf',
  'otf': 'font/otf',
  'pdf': 'application/pdf',
  'xml': 'application/xml; charset=utf-8',
  'txt': 'text/plain; charset=utf-8'
};

export function isBinaryFile(path: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return BINARY_EXTENSIONS.has(ext);
}

export function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export function decodeText(content: Uint8Array<ArrayBuffer>): string {
  try {
    return new TextDecoder('utf-8').decode(content);
  } catch {
    return '/* Failed decoding file text */';
  }
}

export function createVirtualFile(
  path: string,
  content: Uint8Array<ArrayBuffer>
): VirtualFile {
  const isBinary = isBinaryFile(path);
  return {
    path,
    content,
    size: content.length,
    isBinary,
    textContent: isBinary ? undefined : decodeText(content),
  };
}

export function parseZipBuffer(uint8Array: Uint8Array<ArrayBuffer>): VirtualFile[] {
  const unzipped = fflate.unzipSync(uint8Array);
  const files: VirtualFile[] = [];

  Object.entries(unzipped).forEach(([path, content]) => {
    if (path.endsWith('/') || content.length === 0 || path.includes('__MACOSX')) {
      return;
    }
    files.push(createVirtualFile(path, content));
  });

  return files;
}

export async function parseFolderFileList(fileList: FileList): Promise<VirtualFile[]> {
  const files: VirtualFile[] = [];

  const promises = Array.from(fileList).map(async (file) => {
    let path = file.webkitRelativePath;
    // Strip out the first level directory name so index.html is root
    const firstSlash = path.indexOf('/');
    if (firstSlash !== -1) {
      path = path.substring(firstSlash + 1);
    }

    const buffer = await file.arrayBuffer();
    const content = new Uint8Array(buffer);
    files.push(createVirtualFile(path, content));
  });

  await Promise.all(promises);
  return files;
}

export function resolveDefaultHtmlPath(files: VirtualFile[]): string {
  const htmlPaths = files
    .map(f => f.path)
    .filter(p => p.toLowerCase().endsWith('.html') || p.toLowerCase().endsWith('.htm'));

  if (htmlPaths.length === 0) {
    return 'index.html';
  }

  const indexMatch = htmlPaths.find(
    p => p.toLowerCase() === 'index.html' || p.toLowerCase().endsWith('/index.html')
  );
  return indexMatch || htmlPaths[0];
}
