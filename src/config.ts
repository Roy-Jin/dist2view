/**
 * Dist2View global configuration
 * Centralizes all configurable path prefixes, cache strategies, sandbox policies, etc.
 */

// ─── Sandbox Routing ───
/** URL path prefix for the preview sandbox */
export const SANDBOX_URL_PREFIX = '/sb/';

/** Cache Storage name prefix */
export const CACHE_NAME_PREFIX = 'sb-';

/** Build sandbox URL */
export const buildSandboxUrl = (sandboxId: string, filePath: string) =>
  `${window.location.origin}${SANDBOX_URL_PREFIX}${sandboxId}/${filePath}`;

/** Build preview base URL (relative path) */
export const buildPreviewBaseUrl = (sandboxId: string) =>
  `${SANDBOX_URL_PREFIX}${sandboxId}/`;

/** Build cache name */
export const buildCacheName = (sandboxId: string) =>
  `${CACHE_NAME_PREFIX}${sandboxId}`;

// ─── Sandbox ID Prefix ───
export const SANDBOX_ID_PREFIX = {
  zip: 'z',
  folder: 'f',
  demo: 'd',
} as const;

/** Generate sandbox ID */
export const generateSandboxId = (type: keyof typeof SANDBOX_ID_PREFIX) =>
  `${SANDBOX_ID_PREFIX[type]}${Date.now()}`;

// ─── Cache Response Headers ───
export const CACHE_RESPONSE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Access-Control-Allow-Origin': '*',
};

// ─── iframe Sandbox Policy ───
export const IFRAME_SANDBOX_POLICY =
  'allow-scripts allow-same-origin allow-forms allow-popups allow-modals';

// ─── Service Worker ───
export const SW_SCRIPT_URL = '/sw.js';

// ─── Export Filename ───
export const EXPORT_FILENAME_PREFIX = 'dist2view-export-';
