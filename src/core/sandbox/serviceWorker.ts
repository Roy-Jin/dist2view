import { SW_SCRIPT_URL } from '../config';

export interface ServiceWorkerRegistrationResult {
  registered: boolean;
  error: string | null;
  scope?: string;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistrationResult> {
  if (!('serviceWorker' in navigator)) {
    return {
      registered: false,
      error: 'Service Workers not supported in this browser.',
    };
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_SCRIPT_URL);
    console.log('Service Worker active. Scope:', registration.scope);
    return {
      registered: true,
      error: null,
      scope: registration.scope,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration error';
    console.error('Service Worker registration failed:', err);
    return {
      registered: false,
      error: message,
    };
  }
}
