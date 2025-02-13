/// <reference types="vite/client" />

interface Window {
  workbox: any;
}

// Service Worker types
interface ServiceWorkerRegistration {
  pushManager: PushManager;
}

interface PushManager {
  getSubscription(): Promise<PushSubscription | null>;
  subscribe(options: PushSubscriptionOptionsInit): Promise<PushSubscription>;
}

interface PushSubscription {
  unsubscribe(): Promise<boolean>;
  toJSON(): string;
}