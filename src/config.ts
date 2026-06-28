/**
 * Dist2View 全局配置
 * 集中管理所有可配置的路径前缀、Cache 策略、沙盒策略等
 */

// ─── 沙盒路由 ───
/** 预览沙盒的 URL 路径前缀 */
export const SANDBOX_URL_PREFIX = '/sb/';

/** Cache Storage 名称前缀 */
export const CACHE_NAME_PREFIX = 'sb-';

/** 构建沙盒 URL */
export const buildSandboxUrl = (sandboxId: string, filePath: string) =>
  `${window.location.origin}${SANDBOX_URL_PREFIX}${sandboxId}/${filePath}`;

/** 构建预览基础 URL（相对路径） */
export const buildPreviewBaseUrl = (sandboxId: string) =>
  `${SANDBOX_URL_PREFIX}${sandboxId}/`;

/** 构建 Cache 名称 */
export const buildCacheName = (sandboxId: string) =>
  `${CACHE_NAME_PREFIX}${sandboxId}`;

// ─── 沙盒 ID 前缀 ───
export const SANDBOX_ID_PREFIX = {
  zip: 'z',
  folder: 'f',
  demo: 'd',
} as const;

/** 生成沙盒 ID */
export const generateSandboxId = (type: keyof typeof SANDBOX_ID_PREFIX) =>
  `${SANDBOX_ID_PREFIX[type]}${Date.now()}`;

// ─── Cache 响应头 ───
export const CACHE_RESPONSE_HEADERS: Record<string, string> = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Access-Control-Allow-Origin': '*',
};

// ─── iframe 沙盒策略 ───
export const IFRAME_SANDBOX_POLICY =
  'allow-scripts allow-same-origin allow-forms allow-popups allow-modals';

// ─── Service Worker ───
export const SW_SCRIPT_URL = '/sw.js';

// ─── 导出文件名 ───
export const EXPORT_FILENAME_PREFIX = 'dist2view-export-';
