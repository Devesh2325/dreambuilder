export type Placement = 'top' | 'bottom' | 'left' | 'right';

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

const GAP = 12;
const MARGIN = 8;

/**
 * Where to draw a tour step: on the requested side of the target if it fits,
 * otherwise the opposite side, and always kept inside the viewport.
 */
export function positionStep(target: Rect, step: Size, viewport: Size, placement: Placement): { top: number; left: number; placement: Placement } {
  const opposite: Record<Placement, Placement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

  const coords = (side: Placement) => {
    switch (side) {
      case 'top':
        return { top: target.top - step.height - GAP, left: target.left + target.width / 2 - step.width / 2 };
      case 'bottom':
        return { top: target.top + target.height + GAP, left: target.left + target.width / 2 - step.width / 2 };
      case 'left':
        return { top: target.top + target.height / 2 - step.height / 2, left: target.left - step.width - GAP };
      case 'right':
        return { top: target.top + target.height / 2 - step.height / 2, left: target.left + target.width + GAP };
    }
  };

  const fits = (side: Placement) => {
    const { top, left } = coords(side);
    if (side === 'top') return top >= MARGIN;
    if (side === 'bottom') return top + step.height <= viewport.height - MARGIN;
    if (side === 'left') return left >= MARGIN;
    return left + step.width <= viewport.width - MARGIN;
  };

  const side = fits(placement) || !fits(opposite[placement]) ? placement : opposite[placement];
  const { top, left } = coords(side);
  const clamp = (value: number, max: number) => Math.max(MARGIN, Math.min(value, Math.max(MARGIN, max)));
  return {
    top: clamp(top, viewport.height - step.height - MARGIN),
    left: clamp(left, viewport.width - step.width - MARGIN),
    placement: side,
  };
}

/**
 * Builds a selector for an element on a customer's page, preferring attributes
 * that survive page changes over position in the DOM.
 */
export function selectorFor(element: Element): string {
  const stableAttr = ['data-testid', 'data-test', 'data-cy', 'data-tour', 'name', 'aria-label'];
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === 1 && current !== current.ownerDocument.documentElement) {
    if (current.id && !/\d{3,}/.test(current.id)) {
      parts.unshift(`#${CSS.escape(current.id)}`);
      break;
    }
    const attr = stableAttr.find((name) => current!.getAttribute(name));
    if (attr) {
      const value = current.getAttribute(attr)!.replace(/["\\]/g, '\\$&');
      parts.unshift(`${current.tagName.toLowerCase()}[${attr}="${value}"]`);
      break;
    }
    const tag: string = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;
    if (!parent) {
      parts.unshift(tag);
      break;
    }
    const sameTag = Array.from(parent.children).filter((child) => child.tagName === current!.tagName);
    parts.unshift(sameTag.length > 1 ? `${tag}:nth-of-type(${sameTag.indexOf(current) + 1})` : tag);
    current = parent;
  }
  return parts.join(' > ');
}
