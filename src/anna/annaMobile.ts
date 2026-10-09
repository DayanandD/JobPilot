import { getAnnaRuntime } from './annaClient';

export async function triggerHapticFeedback(pattern: 'light' | 'medium' | 'heavy' = 'light'): Promise<boolean> {
  const runtime = getAnnaRuntime() as any;

  if (runtime.mobile && typeof runtime.mobile.haptics === 'function') {
    try {
      await runtime.mobile.haptics({ pattern });
      return true;
    } catch (err) {
      console.warn('[annaMobile] haptics unavailable in desktop container.', err);
    }
  }

  // Web Vibration API fallback
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const duration = pattern === 'heavy' ? 30 : pattern === 'medium' ? 20 : 10;
    navigator.vibrate(duration);
    return true;
  }

  return false;
}

export async function shareContent(title: string, text: string, url?: string): Promise<boolean> {
  const runtime = getAnnaRuntime() as any;

  if (runtime.mobile && typeof runtime.mobile.share === 'function') {
    try {
      await runtime.mobile.share({ title, text, url });
      return true;
    } catch (err) {
      console.warn('[annaMobile] native share unavailable.', err);
    }
  }

  if (typeof navigator !== 'undefined' && (navigator as any).share) {
    try {
      await (navigator as any).share({ title, text, url });
      return true;
    } catch (err) {
      console.warn('Web Share API failed:', err);
    }
  }

  return false;
}
