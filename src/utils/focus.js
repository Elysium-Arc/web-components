const FOCUSABLE_SELECTORS = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
];

function isVisible(element) {
  return element.getClientRects().length > 0;
}

export function getFocusableElements(root) {
  if (!root) {
    return [];
  }
  const nodes = Array.from(root.querySelectorAll(FOCUSABLE_SELECTORS.join(',')));
  return nodes.filter((node) => isVisible(node));
}

export function focusFirst(root) {
  const focusables = getFocusableElements(root);
  if (focusables.length === 0) {
    return false;
  }
  focusables[0].focus();
  return true;
}

export function trapTabKey(event, root) {
  if (event.key !== 'Tab') {
    return;
  }
  const focusables = getFocusableElements(root);
  if (focusables.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (event.shiftKey) {
    if (active === first || !root.contains(active)) {
      event.preventDefault();
      last.focus();
    }
    return;
  }

  if (active === last) {
    event.preventDefault();
    first.focus();
  }
}
