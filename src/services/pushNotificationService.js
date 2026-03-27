import apiService from './api';

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isInitializing = false;
  }

  async initialize() {
    if (this.isInitializing) return;
    this.isInitializing = true;
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return;
      }
      if (Notification.permission === 'denied') return;

      await this.registerServiceWorker();
      await this.ensureSubscribed();
    } catch (error) {
      console.warn('Push notification init skipped:', error?.message || error);
    } finally {
      this.isInitializing = false;
    }
  }

  async registerServiceWorker() {
    if (this.registration) return this.registration;
    this.registration = await navigator.serviceWorker.register('/sw.js');
    return this.registration;
  }

  async ensureSubscribed() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await this.registerServiceWorker();
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const publicKey = await this.getPublicKey();
      if (!publicKey) return;
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.base64ToUint8Array(publicKey),
      });
    }

    this.subscription = subscription;
    await apiService.post('/web-push/subscribe', {
      subscription: subscription.toJSON(),
    });
  }

  async getPublicKey() {
    const envKey = import.meta.env?.VITE_WEB_PUSH_PUBLIC_KEY || '';
    if (envKey) return envKey;
    try {
      const response = await apiService.post('/web-push/public-key', {});
      return response?.publicKey || '';
    } catch {
      return '';
    }
  }

  base64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default new PushNotificationService();
