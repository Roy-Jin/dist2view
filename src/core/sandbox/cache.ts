import { buildSandboxUrl } from './url';
import { getMimeType } from '../file/parser';
import { CACHE_RESPONSE_HEADERS } from '../config';

export async function openSandboxCache(sandboxId: string): Promise<Cache> {
  return caches.open(`sb-${sandboxId}`);
}

export async function writeFileToCache(
  sandboxId: string,
  path: string,
  content: Uint8Array<ArrayBuffer>,
  extraHeaders?: Record<string, string>
): Promise<void> {
  const cache = await openSandboxCache(sandboxId);
  const requestUrl = buildSandboxUrl(sandboxId, path);
  const response = new Response(content, {
    headers: {
      'Content-Type': getMimeType(path),
      ...CACHE_RESPONSE_HEADERS,
      ...extraHeaders,
    },
  });
  await cache.put(requestUrl, response);
}

export async function deleteFileFromCache(
  sandboxId: string,
  path: string
): Promise<void> {
  const cache = await openSandboxCache(sandboxId);
  const requestUrl = buildSandboxUrl(sandboxId, path);
  await cache.delete(requestUrl);
}

export async function deleteFilesFromCache(
  sandboxId: string,
  paths: string[]
): Promise<void> {
  const cache = await openSandboxCache(sandboxId);
  await Promise.all(
    paths.map(async (path) => {
      const requestUrl = buildSandboxUrl(sandboxId, path);
      await cache.delete(requestUrl);
    })
  );
}
