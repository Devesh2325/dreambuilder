import { useEffect, useState } from 'react';
import { useStudio } from './store';

export type ComputedBox = Record<'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft' | 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft' | 'gap', string> & { display: string };

const KEYS = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const;

const toNumberText = (value: string) => {
  const number = parseFloat(value);
  return Number.isNaN(number) ? '0' : String(Math.round(number * 10) / 10);
};

/**
 * What a block's spacing really is on the canvas right now. Most spacing comes from the
 * block's defaults, which aren't stored on the block, so without this every box would say 0.
 */
export function useComputedBox(nodeId: string): ComputedBox | null {
  const documents = useStudio((s) => s.documents);
  const device = useStudio((s) => s.device);
  const theme = useStudio((s) => s.draft?.theme);
  const [box, setBox] = useState<ComputedBox | null>(null);

  useEffect(() => {
    let active = true;
    const read = () => {
      if (!active) return;
      const frame = document.querySelector<HTMLIFrameElement>('iframe[title="Design canvas"]');
      const doc = frame?.contentDocument;
      const element = doc?.querySelector(`[data-fp-node="${CSS.escape(nodeId)}"]`);
      const view = doc?.defaultView;
      if (!element || !view) {
        setBox(null);
        return;
      }
      const style = view.getComputedStyle(element);
      const next = { display: style.display, gap: style.columnGap === 'normal' ? '0' : toNumberText(style.rowGap === 'normal' ? style.columnGap : style.rowGap) } as ComputedBox;
      for (const key of KEYS) next[key] = toNumberText(style[key]);
      setBox((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
    };
    // After the canvas has drawn this change, and again once a device switch has settled.
    const frameId = requestAnimationFrame(read);
    const timer = setTimeout(read, 250);
    return () => {
      active = false;
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [nodeId, documents, device, theme]);

  return box;
}
