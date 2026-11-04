import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Theme } from '../core/schema';
import { googleFontsUrl } from './css';

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
      doc.body.style.margin = '0';
      setMount(doc.body);
      onDocument?.(doc);
    };

    // Chrome has a usable document straight away, while Firefox replaces it on load.
    setup();
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
    <iframe ref={frameRef} title={title} className={className} style={{ border: 0, ...style }}>
      {mount && createPortal(children, mount)}
    </iframe>
  );
};
