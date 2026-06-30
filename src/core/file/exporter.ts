import * as fflate from 'fflate';
import { VirtualFile } from '../types';

export function buildZipArchive(files: VirtualFile[]): Uint8Array {
  const filesRecord: Record<string, Uint8Array> = {};

  files.forEach(file => {
    const relativePath = file.path.replace(/^\//, '');
    filesRecord[relativePath] = file.content;
  });

  return fflate.zipSync(filesRecord, { level: 6 });
}

export function triggerZipDownload(files: VirtualFile[], zipName: string = 'dist-export.zip'): void {
  const zipUint8Array = buildZipArchive(files);
  const blob = new Blob([zipUint8Array as unknown as BlobPart], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
