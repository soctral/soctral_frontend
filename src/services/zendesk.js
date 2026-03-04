const ZENDESK_HELP_URL = 'https://soctraltechnologyhelp.zendesk.com';

/**
 * Open Zendesk chat widget when ready.
 * Uses zE callback so the open runs after the widget is loaded; tries both messenger and webWidget APIs.
 * Falls back to help center in a new tab if the widget is unavailable (e.g. script not loaded yet).
 */
export function openZendeskChat() {
  const tryOpen = () => {
    if (typeof window.zE !== 'function') return false;
    try {
      window.zE(function () {
        try {
          window.zE('messenger', 'show');
          window.zE('messenger', 'open');
        } catch (_) {
          try {
            window.zE('webWidget', 'open');
          } catch (__) {}
        }
      });
      return true;
    } catch (e) {
      try {
        window.zE('webWidget', 'open');
        return true;
      } catch (e2) {
        return false;
      }
    }
  };
  if (tryOpen()) return;
  setTimeout(() => {
    if (!tryOpen()) window.open(ZENDESK_HELP_URL, '_blank');
  }, 800);
}
