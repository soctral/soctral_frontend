export const ZENDESK_HELP_URL = 'https://soctraltechnologyhelp.zendesk.com';

function getZE() {
  if (typeof window === 'undefined') return null;
  const w = window;
  if (typeof w.zE === 'function') return w.zE;
  if (w.zE != null && typeof w.zE === 'object') return w.zE;
  return null;
}

/**
 * Open the in-page Zendesk chat widget (same as the launcher on the bottom right).
 * Tries Messaging API then Web Widget (Classic). Only opens help center in new tab if widget still not available after several seconds.
 */
export function openZendeskChat() {
  try {
    const runOpen = (zE) => {
      if (!zE || typeof zE !== 'function') return false;
      try {
        zE('messenger', 'show');
        zE('messenger', 'open');
        return true;
      } catch (_) {
        try {
          zE('webWidget', 'open');
          return true;
        } catch (__) {
          return false;
        }
      }
    };

    const tryOpen = () => {
      const zE = getZE();
      if (!zE) return false;
      // Prefer callback form so widget is ready (per Zendesk docs)
      try {
        zE(function () {
          const ze = getZE();
          if (!runOpen(ze)) {
            try { ze('webWidget', 'open'); } catch (_) {}
          }
        });
        return true;
      } catch (_) {
        return runOpen(zE);
      }
    };

    if (tryOpen()) return;

    // Widget/snippet not ready: poll and try again (no new tab yet)
    let attempts = 0;
    const maxAttempts = 50; // ~5s
    const interval = setInterval(() => {
      attempts++;
      if (getZE()) {
        clearInterval(interval);
        tryOpen();
        return;
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        // Only then fall back to help center in new tab
        try {
          window.open(ZENDESK_HELP_URL, '_blank', 'noopener,noreferrer');
        } catch (_) {}
      }
    }, 100);
  } catch (_) {
    try {
      window.open(ZENDESK_HELP_URL, '_blank', 'noopener,noreferrer');
    } catch (__) {}
  }
}
