import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Theme } from '../core/schema';
import { googleFontsUrl } from './css';

// The doctype matters: without it the frame renders in quirks mode, and pages could
// look different in the editor than they do when published.
const FRAME_HTML = '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0"></body></html>';

interface FrameProps {
  title: string;
  theme: Theme;
  className?: string;
  style?: React.CSSProperties;
  onDocument?: (doc: Document) => void;
  children: React.ReactNode;
}

/**
 * Draws its children inside a same-origin iframe through a React portal. App styles
 * can't leak in, and media queries respond to the frame's width, so device previews
 * are accurate.
 */
export const Frame: React.FC<FrameProps> = ({ title, theme, className, style, onDocument, children }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const setup = () => {
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      setMount(doc.body);
      onDocument?.(doc);
    };

    // The srcDoc document replaces the initial blank one, so it's only ready after load.
    frame.addEventListener('load', setup);
    return () => frame.removeEventListener('load', setup);
    // onDocument is only needed the first time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fontsUrl = googleFontsUrl(theme);

  useLayoutEffect(() => {
    const doc = mount?.ownerDocument;
    if (!doc) return undefined;
    let link = doc.getElementById('fp-fonts') as HTMLLinkElement | null;
    if (!fontsUrl) {
      link?.remove();
      return undefined;
    }
    if (!link) {
      link = doc.createElement('link');
      link.id = 'fp-fonts';
      link.rel = 'stylesheet';
      doc.head.appendChild(link);
    }
    if (link.href !== fontsUrl) link.href = fontsUrl;
    return undefined;
  }, [mount, fontsUrl]);

  return (
    <iframe ref={frameRef} title={title} srcDoc={FRAME_HTML} className={className} style={{ border: 0, ...style }}>
      {mount && createPortal(children, mount)}
    </iframe>
  );
};
