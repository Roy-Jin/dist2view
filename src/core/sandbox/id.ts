import { SANDBOX_ID_PREFIX } from '../config';

export type SandboxType = keyof typeof SANDBOX_ID_PREFIX;

export function generateSandboxId(type: SandboxType): string {
  return `${SANDBOX_ID_PREFIX[type]}${Date.now()}`;
}
