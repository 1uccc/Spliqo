let activeModalsCount = 0;

/**
 * Locks background scrolling when a modal or dialog opens.
 * Uses a reference counter so nested modals (e.g. ExpenseModal -> CameraModal or ConfirmDialog)
 * do not prematurely restore scrolling.
 */
export function lockBodyScroll() {
  activeModalsCount++;
  if (activeModalsCount === 1) {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  }
}

/**
 * Unlocks background scrolling when a modal closes.
 * Thoroughly removes all inline overflow styles so iOS WebKit
 * touch gestures and momentum scrolling are 100% cleanly restored.
 */
export function unlockBodyScroll() {
  activeModalsCount = Math.max(0, activeModalsCount - 1);
  if (activeModalsCount === 0) {
    if (typeof document !== 'undefined') {
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
  }
}

/**
 * Emergency reset to guarantee scroll is unlocked if needed (e.g. route change)
 */
export function forceUnlockBodyScroll() {
  activeModalsCount = 0;
  if (typeof document !== 'undefined') {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    document.body.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('overflow');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}
