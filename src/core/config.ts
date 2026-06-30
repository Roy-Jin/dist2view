/**
 * Dist2View global configuration
 * Centralizes all configurable path prefixes, cache strategies, sandbox policies, etc.
 */

// Sandbox Routing
/** URL path prefix for the preview sandbox */
export const SANDBOX_URL_PREFIX = '/sb/';

/** Cache Storage name prefix */
export const CACHE_NAME_PREFIX = 'sb-';

/** iframe Sandbox Policy */
export const IFRAME_SANDBOX_POLICY =
  'allow-scripts allow-same-origin allow-forms allow-popups allow-modals';

/** Service Worker script URL */
export const SW_SCRIPT_URL = '/sw.js';

/** Exported ZIP filename prefix */
export const EXPORT_FILENAME_PREFIX = 'dist2view-export-';

/** Default cache response headers written for sandbox resources */
export const CACHE_RESPONSE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Access-Control-Allow-Origin': '*',
};

// Sandbox ID Prefix
export const SANDBOX_ID_PREFIX = {
  zip: 'z',
  folder: 'f',
  demo: 'd',
} as const;
