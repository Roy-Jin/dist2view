import {
  SANDBOX_URL_PREFIX,
  CACHE_NAME_PREFIX,
} from '../config';

export function buildSandboxUrl(sandboxId: string, filePath: string): string {
  return `${window.location.origin}${SANDBOX_URL_PREFIX}${sandboxId}/${filePath}`;
}

export function buildPreviewBaseUrl(sandboxId: string): string {
  return `${SANDBOX_URL_PREFIX}${sandboxId}/`;
}

export function buildCacheName(sandboxId: string): string {
  return `${CACHE_NAME_PREFIX}${sandboxId}`;
}
