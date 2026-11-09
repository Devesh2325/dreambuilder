import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { safeImageUrl, safeUrl } from '../core/variables';
import { parseVideoUrl } from '../core/video';
import { RenderNode } from '../core/variables';
import { ICON_DATA } from './iconData';
import { BlockRenderProps, NavLink, RenderContext } from './types';

type Block = React.FC<BlockRenderProps>;

const asText = (value: unknown): string => (value === undefined || value === null ? '' : String(value));

const withClass = (attrs: BlockRenderProps['attrs'], className: string) => ({
  ...attrs,
  className: `${className} ${attrs.className}`,
});

const container = (className: string): Block => ({ attrs, children }) => <div {...withClass(attrs, className)}>{children}</div>;

const Section: Block = ({ node, attrs, children }) => {
  const anchor = asText(node.props.anchor);
  return (
    <section {...withClass(attrs, 'fp-section')} id={/^[a-zA-Z][\w-]*$/.test(anchor) ? anchor : undefined}>
      {children}
    </section>
  );
};

const Heading: Block = ({ node, attrs }) => {
  const level = ['h1', 'h2', 'h3', 'h4'].includes(asText(node.props.level)) ? asText(node.props.level) : 'h2';
  return React.createElement(level, withClass(attrs, `fp-heading fp-${level}`), asText(node.props.text));
};

const Text: Block = ({ node, attrs }) => <p {...withClass(attrs, 'fp-text')}>{asText(node.props.text)}</p>;

function handleLinkClick(event: React.MouseEvent, href: string, ctx: RenderContext) {
  if (ctx.mode === 'edit') {
    event.preventDefault();
    return;
  }
  if (ctx.mode === 'preview') {
    // Previews run in a srcdoc iframe, where even "#" resolves against the app's own
    // address, so following a link would load the whole app inside the preview.
    event.preventDefault();
    if (href.startsWith('#')) {
      if (href.length > 1) (event.currentTarget as Element).ownerDocument.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else if (href.startsWith('/')) {
      ctx.navigate?.(href);
    } else {
      window.open(href, '_blank', 'noopener');
    }
    return;
  }
  if (ctx.navigate && href.startsWith('/')) {
    event.preventDefault();
    ctx.navigate(href);
  }
}

const Button: Block = ({ node, attrs, ctx }) => {
  const variant = ['primary', 'secondary', 'link'].includes(asText(node.props.variant)) ? asText(node.props.variant) : 'primary';
  const props = withClass(attrs, `fp-btn fp-btn-${variant}`);
  const action = asText(node.props.action) || 'link';
  const label = asText(node.props.text);

  if (action !== 'link') {
    return (
      <button type="button" {...props} onClick={() => ctx.mode !== 'edit' && ctx.onAction?.(action)}>
        {label}
      </button>
    );
  }
  const href = safeUrl(node.props.href);
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        ctx.track?.('cta_clicked', { label });
        handleLinkClick(event, href, ctx);
      }}
    >
      {label}
    </a>
  );
};

const Image: Block = ({ node, attrs }) => {
  const src = safeImageUrl(node.props.src);
  if (!src) return <div {...withClass(attrs, 'fp-image')} />;
  return <img {...withClass(attrs, 'fp-image')} src={src} alt={asText(node.props.alt)} loading="lazy" />;
};

const Video: Block = ({ node, attrs, ctx }) => {
  const source = parseVideoUrl(node.props.url);
  const title = asText(node.props.title) || 'Video';
  const autoplay = Boolean(node.props.autoplay);
  const controls = node.props.controls !== false;
  const loop = Boolean(node.props.loop);
  const muted = Boolean(node.props.muted || autoplay);
  const ratio = asText(node.props.aspectRatio) || '16:9';

  const ratioStyle: React.CSSProperties = {
    aspectRatio: ratio === '4:3' ? '4/3' : ratio === '1:1' ? '1/1' : ratio === '9:16' ? '9/16' : '16/9',
  };

  if (!source) {
    if (ctx.mode !== 'edit') return null;
    return (
      <div {...withClass(attrs, 'fp-video fp-video-empty')} style={ratioStyle} data-empty="true">
        <p style={{ margin: 0 }}>Paste a YouTube link or upload a video file</p>
      </div>
    );
  }

  let iframeSrc = source.src;
  if (source.kind === 'iframe' && iframeSrc.includes('youtube')) {
    const params: string[] = ['rel=0'];
    if (autoplay) params.push('autoplay=1');
    if (muted) params.push('mute=1');
    if (loop) params.push('loop=1');
    if (!controls) params.push('controls=0');
    iframeSrc += (iframeSrc.includes('?') ? '&' : '?') + params.join('&');
  }

  return (
    <div {...withClass(attrs, 'fp-video')} style={ratioStyle}>
      {source.kind === 'iframe' ? (
        <iframe
          src={iframeSrc}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        />
      ) : (
        <video
          src={source.src}
          title={title}
          controls={controls}
          autoPlay={autoplay}
          loop={loop}
          muted={muted}
          playsInline
          preload="metadata"
        />
      )}
    </div>
  );
};

/**
 * The provider takes the payment on its own secure page. Card details never pass through
 * this page, which is why this is a link and not a form.
 */
const PaymentButton: Block = ({ node, attrs, ctx }) => {
  const url = asText(node.props.url);
  const href = /^https:\/\//i.test(url) ? safeUrl(url) : '';
  const price = asText(node.props.price);
  const label = asText(node.props.text) || 'Buy now';
  if (!href && ctx.mode !== 'edit') return null;
  return (
    <div {...withClass(attrs, 'fp-pay')}>
      {price && <span className="fp-pay-price">{price}</span>}
      <a
        className="fp-btn fp-btn-primary"
        href={href || '#'}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          if (ctx.mode === 'edit') event.preventDefault();
          else ctx.track?.('payment_clicked', { label, provider: asText(node.props.provider) });
        }}
      >
        {label}
      </a>
      {!href && <span className="fp-pay-hint">Add your payment link to make this work</span>}
    </div>
  );
};

const ProjectEmbed: Block = ({ node, attrs, ctx }) => {
  const id = asText(node.props.projectId);
  const content = id ? ctx.renderEmbed?.(id) : null;
  if (!content && ctx.mode !== 'edit') return null;
  return <div {...withClass(attrs, 'fp-embed')}>{content ?? <p className="fp-embed-empty">Choose which of your projects to show here.</p>}</div>;
};

const initialsOf = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0] ?? '').join('').toUpperCase();

const Avatar: Block = ({ node, attrs }) => {
  const src = safeImageUrl(node.props.src);
  const name = asText(node.props.name);
  const subtitle = asText(node.props.subtitle);
  const size = ['small', 'medium', 'large'].includes(asText(node.props.size)) ? asText(node.props.size) : 'medium';
  return (
    <div {...withClass(attrs, `fp-avatar fp-avatar-${size}`)}>
      {src ? <img className="fp-avatar-photo" src={src} alt={node.props.showText === false ? name : ''} loading="lazy" /> : <span className="fp-avatar-photo" aria-hidden={node.props.showText !== false}>{initialsOf(name) || '?'}</span>}
      {node.props.showText !== false && (name || subtitle) && (
        <span className="fp-avatar-text">
          {name && <span className="fp-avatar-name">{name}</span>}
          {subtitle && <span className="fp-avatar-subtitle">{subtitle}</span>}
        </span>
      )}
    </div>
  );
};

/** Drawn from shapes, since blocks can't import an icon library. */
export const IconShape: React.FC<{ name: string; size: number; label?: string; className?: string }> = ({ name, size, label, className }) => {
  const icon = ICON_DATA[name] ?? ICON_DATA.star;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
      {icon.node.map(([tag, shape], index) => React.createElement(tag, { key: index, ...shape }))}
    </svg>
  );
};

const Icon: Block = ({ node, attrs }) => {
  const size = Math.min(256, Math.max(8, Number(node.props.size) || 32));
  return <span {...withClass(attrs, 'fp-icon')}><IconShape name={asText(node.props.icon)} size={size} label={asText(node.props.label)} /></span>;
};

const List: Block = ({ node, attrs }) => {
  const items = asText(node.props.items).split('\n').map((item) => item.trim()).filter(Boolean);
  const style = ['bullet', 'number', 'check'].includes(asText(node.props.style)) ? asText(node.props.style) : 'bullet';
  const content = items.map((item, index) => (
    <li key={index}>
      {style === 'check' && <IconShape name="check" size={18} className="fp-list-tick" />}
      <span>{item}</span>
    </li>
  ));
  return style === 'number'
    ? <ol {...withClass(attrs, 'fp-list fp-list-number')}>{content}</ol>
    : <ul {...withClass(attrs, `fp-list fp-list-${style}`)}>{content}</ul>;
};

const Quote: Block = ({ node, attrs }) => {
  const cite = asText(node.props.cite);
  return (
    <figure {...withClass(attrs, 'fp-quote')}>
      <blockquote>{asText(node.props.text)}</blockquote>
      {cite && <figcaption>{cite}</figcaption>}
    </figure>
  );
};

const CodeBlock: Block = ({ node, attrs, ctx }) => {
  const code = asText(node.props.code);
  const [copied, setCopied] = useState(false);
  return (
    <div {...withClass(attrs, 'fp-code')}>
      <div className="fp-code-bar">
        <span>{asText(node.props.language)}</span>
        <button type="button" className="fp-code-copy" onClick={() => {
          if (ctx.mode === 'edit') return;
          navigator.clipboard?.writeText(code).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }).catch(() => undefined);
        }}>{copied ? 'Copied' : 'Copy'}</button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
};

const CALLOUT_ICONS: Record<string, string> = { info: 'info', success: 'lightbulb', warning: 'triangle-alert', danger: 'triangle-alert' };

const Callout: Block = ({ node, attrs }) => {
  const tone = CALLOUT_ICONS[asText(node.props.tone)] ? asText(node.props.tone) : 'info';
  const title = asText(node.props.title);
  return (
    <aside {...withClass(attrs, `fp-callout fp-callout-${tone}`)}>
      <IconShape name={CALLOUT_ICONS[tone]} size={20} className="fp-callout-icon" />
      <div>
        {title && <p className="fp-callout-title">{title}</p>}
        <p className="fp-callout-text">{asText(node.props.text)}</p>
      </div>
    </aside>
  );
};

const Table: Block = ({ node, attrs }) => {
  const rows = asText(node.props.rows).split('\n').filter((row) => row.trim()).map((row) => row.split('|').map((cell) => cell.trim()));
  const hasHeader = node.props.header !== false && rows.length > 1;
  const head = hasHeader ? rows[0] : null;
  const body = hasHeader ? rows.slice(1) : rows;
  return (
    <div {...withClass(attrs, 'fp-table')}>
      <table>
        {head && <thead><tr>{head.map((cell, index) => <th key={index} scope="col">{cell}</th>)}</tr></thead>}
        <tbody>{body.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
};

const Badge: Block = ({ node, attrs }) => {
  const tone = ['primary', 'neutral', 'success', 'warning'].includes(asText(node.props.tone)) ? asText(node.props.tone) : 'primary';
  return <span {...withClass(attrs, `fp-badge fp-badge-${tone}`)}>{asText(node.props.text)}</span>;
};

const Divider: Block = ({ attrs }) => <hr {...withClass(attrs, 'fp-divider')} />;

const Spacer: Block = ({ node, attrs }) => <div {...attrs} style={{ height: Number(node.props.height) || 0 }} />;

interface MenuLink {
  label?: unknown;
  href?: unknown;
}

const Navbar: Block = ({ node, attrs, ctx }) => {
  const [isOpen, setIsOpen] = useState(false);
  const custom = Array.isArray(node.props.links) ? (node.props.links as MenuLink[]) : [];
  // With no links of its own, the menu lists the website's pages.
  const links: NavLink[] = custom.length > 0
    ? custom
      .filter((link) => asText(link.label))
      .map((link) => {
        const href = safeUrl(link.href);
        return { label: asText(link.label), href, current: ctx.navLinks?.some((page) => page.current && page.href === href) };
      })
    : (ctx.navLinks ?? []);
  const logo = safeImageUrl(node.props.logo);
  const brand = asText(node.props.brand);
  const ctaText = asText(node.props.ctaText);
  const ctaHref = safeUrl(node.props.ctaHref);
  const homeHref = ctx.navLinks?.[0]?.href ?? '#';
  const align = ['left', 'center', 'right'].includes(asText(node.props.align)) ? asText(node.props.align) : 'right';
  const go = (event: React.MouseEvent, href: string) => {
    setIsOpen(false);
    handleLinkClick(event, href, ctx);
  };

  return (
    <nav {...withClass(attrs, 'fp-nav')} aria-label="Main" data-align={align} data-sticky={node.props.sticky === true || undefined}>
      <a className="fp-nav-brand" href={homeHref} onClick={(event) => go(event, homeHref)}>
        {logo && <img src={logo} alt={node.props.showBrand === false ? brand : ''} />}
        {node.props.showBrand !== false && <span>{brand}</span>}
      </a>
      <button
        type="button"
        className="fp-nav-toggle"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        onClick={() => ctx.mode !== 'edit' && setIsOpen(!isOpen)}
      >
        {isOpen ? '×' : '☰'}
      </button>
      <div className="fp-nav-links" data-open={isOpen}>
        {links.map((link) => (
          <a
            key={`${link.label}${link.href}`}
            href={link.href}
            aria-current={link.current ? 'page' : undefined}
            onClick={(event) => go(event, link.href)}
          >
            {link.label}
          </a>
        ))}
      </div>
      <div className="fp-nav-cta" data-open={isOpen}>
        {ctaText && (
          <a className="fp-btn fp-btn-primary" href={ctaHref} onClick={(event) => go(event, ctaHref)}>
            {ctaText}
          </a>
        )}
      </div>
    </nav>
  );
};

const Accordion: Block = ({ node, attrs, ctx }) => (
  <details
    {...withClass(attrs, 'fp-accordion')}
    open={ctx.mode === 'edit' || undefined}
    onToggle={(event) => {
      if ((event.currentTarget as HTMLDetailsElement).open) ctx.track?.('faq_expanded', { question: asText(node.props.question) });
    }}
  >
    <summary>{asText(node.props.question)}</summary>
    <p>{asText(node.props.answer)}</p>
  </details>
);

const Form: Block = ({ node, attrs, children, ctx }) => {
  const steps = node.children
    .map((child, index) => ({ child, index }))
    .filter(({ child }) => child.type === 'FormStep');
  const isMultiStep = steps.length > 1 && ctx.mode !== 'edit';

  const formRef = useRef<HTMLFormElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const isLastStep = !isMultiStep || stepIndex === steps.length - 1;

  const visibleChildren = isMultiStep
    ? children.map((child, index) => (
      node.children[index].type === 'FormStep'
        ? stepWrapper(child, index === steps[stepIndex].index, node.children[index].key)
        : child
    ))
    : children;

  const stepIsValid = () => {
    if (!isMultiStep || !formRef.current) return true;
    const current = formRef.current.querySelector(`[data-fp-key="${steps[stepIndex].child.key}"]`);
    const fields = current ? Array.from(current.querySelectorAll<HTMLInputElement>('input,textarea,select')) : [];
    return fields.every((field) => field.reportValidity());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (ctx.mode === 'edit') return;
    if (!isLastStep) {
      if (stepIsValid()) setStepIndex(stepIndex + 1);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const data: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      const text = String(value);
      if (key in data) data[key] = ([] as unknown[]).concat(data[key], text);
      else data[key] = text;
    });

    setStatus('sending');
    setError(null);
    const result = ctx.submitForm ? await ctx.submitForm(data) : ({ ok: true } as const);
    if (result.ok) {
      setStatus('sent');
      ctx.track?.('form_submitted');
    } else {
      setStatus('idle');
      setError(result.error);
    }
  };

  if (status === 'sent') {
    return (
      <div {...withClass(attrs, 'fp-form')}>
        <p className="fp-form-status" role="status">{asText(node.props.successMessage)}</p>
      </div>
    );
  }

  return (
    <form {...withClass(attrs, 'fp-form')} ref={formRef} onSubmit={handleSubmit}>
      {/* Hidden from people. Bots that fill every field reveal themselves here. */}
      <input type="text" name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} />
      {isMultiStep && (
        <div className="fp-progress" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={steps.length}>
          <span style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
        </div>
      )}
      {visibleChildren}
      {error && <p className="fp-form-status" data-kind="error" role="alert">{error}</p>}
      <div className="fp-form-actions">
        {isMultiStep && stepIndex > 0 ? (
          <button type="button" className="fp-btn fp-btn-secondary" onClick={() => setStepIndex(stepIndex - 1)}>Back</button>
        ) : <span />}
        <button type="submit" className="fp-btn fp-btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : isLastStep ? asText(node.props.submitText) || 'Submit' : 'Next'}
        </button>
      </div>
    </form>
  );
};

/**
 * Every step keeps the same wrapper, visible or not. Adding a wrapper only when hidden
 * would make React rebuild the step and lose what the visitor typed.
 */
function stepWrapper(child: React.ReactNode, visible: boolean, key: string) {
  return <div key={key} style={{ display: visible ? 'contents' : 'none' }}>{child}</div>;
}

const FormStep: Block = ({ node, attrs, children }) => (
  <fieldset {...withClass(attrs, 'fp-form')} style={{ border: 0, padding: 0, margin: 0 }}>
    {asText(node.props.title) && <legend className="fp-heading fp-h4" style={{ padding: 0, marginBottom: 8 }}>{asText(node.props.title)}</legend>}
    {children}
  </fieldset>
);

const FormField: Block = ({ node, attrs, ctx }) => {
  const { label, placeholder } = node.props;
  const name = asText(node.props.name) || node.sourceId;
  const inputType = asText(node.props.inputType) || 'text';
  const required = Boolean(node.props.required);
  const options = asText(node.props.optionsText).split('\n').map((option) => option.trim()).filter(Boolean);
  const disabled = ctx.mode === 'edit';
  const common = { name, required, disabled, placeholder: asText(placeholder), className: 'fp-input' };
  const labelText = `${asText(label)}${required ? ' *' : ''}`;

  if (inputType === 'checkbox') {
    return (
      <label {...withClass(attrs, 'fp-field fp-field-check')}>
        <input type="checkbox" name={name} value="yes" required={required} disabled={disabled} />
        {labelText}
      </label>
    );
  }
  if (inputType === 'radio') {
    return (
      <fieldset {...withClass(attrs, 'fp-field')} style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ padding: 0, marginBottom: 6 }}>{labelText}</legend>
        {options.map((option) => (
          <label key={option} className="fp-field fp-field-check">
            <input type="radio" name={name} value={option} required={required} disabled={disabled} />
            {option}
          </label>
        ))}
      </fieldset>
    );
  }
  return (
    <label {...withClass(attrs, 'fp-field')}>
      {labelText}
      {inputType === 'textarea' ? (
        <textarea {...common} rows={4} />
      ) : inputType === 'select' ? (
        <select {...common}>
          <option value="">{asText(placeholder) || 'Choose...'}</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input {...common} type={['email', 'tel', 'number', 'url', 'date'].includes(inputType) ? inputType : 'text'} />
      )}
    </label>
  );
};

const ScaleField: Block = ({ node, attrs, ctx }) => {
  const min = Number(node.props.min) || 0;
  const max = Math.min(Number(node.props.max) || 10, min + 20);
  const name = asText(node.props.name) || node.sourceId;
  const [value, setValue] = useState<number | null>(null);
  const options = Array.from({ length: Math.max(0, max - min + 1) }, (_, index) => min + index);

  return (
    <div {...withClass(attrs, 'fp-field')}>
      <span>{asText(node.props.label)}</span>
      <div className="fp-scale" role="group" aria-label={asText(node.props.label)}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => ctx.mode !== 'edit' && setValue(option)}
          >
            {option}
          </button>
        ))}
      </div>
      {/*
        Visually hidden rather than type=hidden or readOnly, because browsers skip
        required checks on both of those. Its value only changes through the buttons.
      */}
      <input
        name={name}
        value={value ?? ''}
        onChange={() => undefined}
        required={Boolean(node.props.required) && ctx.mode !== 'edit'}
        tabIndex={-1}
        aria-hidden="true"
        style={{ opacity: 0, height: 0, padding: 0, border: 0 }}
      />
    </div>
  );
};

const oneOf = (value: unknown, allowed: string[], fallback: string) => (allowed.includes(asText(value)) ? asText(value) : fallback);

const TourStep: Block = ({ node, attrs, children, ctx }) => {
  const layout = oneOf(node.props.layout, ['tooltip', 'modal', 'slideout', 'sidebar'], 'tooltip');
  const hasArrow = layout === 'tooltip' && asText(node.props.selector) !== '';
  const chrome = ctx.tourChrome;
  return (
    <div
      {...withClass(attrs, 'fp-step')}
      data-layout={layout}
      data-size={oneOf(node.props.size, ['small', 'medium', 'large', 'xlarge'], 'medium')}
      data-side={hasArrow ? oneOf(node.props.placement, ['top', 'bottom', 'left', 'right'], 'bottom') : undefined}
      data-caret={hasArrow ? asText(node.props.align) || undefined : undefined}
    >
      {chrome?.canClose && <CloseButton ctx={ctx} />}
      {/* Long steps scroll in here, leaving the arrow and close button in place. */}
      <div className="fp-step-body">
        {chrome?.label && <p className="fp-step-progress">{chrome.label}</p>}
        {children}
      </div>
    </div>
  );
};

const DemoScreen: Block = ({ node, attrs, children }) => {
  const image = safeImageUrl(node.props.image);
  return (
    <div {...withClass(attrs, 'fp-screen')}>
      {image && <img src={image} alt={asText(node.props.alt)} />}
      {children}
    </div>
  );
};

const DemoHotspot: Block = ({ node, attrs, ctx }) => {
  const x = Number(node.props.x) || 0;
  const y = Number(node.props.y) || 0;
  const tip = asText(node.props.tip);
  const title = asText(node.props.title);
  const buttonText = asText(node.props.buttonText);
  const goTo = Number(node.props.goTo);
  const go = () => {
    if (ctx.mode !== 'edit') ctx.onAction?.(goTo > 0 ? 'goto' : 'next', goTo - 1);
  };
  const place = { left: `${x}%`, top: `${y}%` };
  return (
    <>
      <button
        type="button"
        {...withClass(attrs, 'fp-hotspot')}
        data-beacon={node.props.showBeacon !== false}
        style={place}
        aria-label={tip || title || 'Continue'}
        onClick={go}
      />
      {(tip || title || buttonText) && (
        <div
          className="fp-hotspot-tip"
          // Grabbing the tooltip in the editor moves it, the same as grabbing the dot.
          data-fp-node={attrs['data-fp-node']}
          data-side={oneOf(node.props.placement, ['top', 'bottom', 'left', 'right'], 'bottom')}
          data-caret={oneOf(node.props.align, ['start', 'center', 'end'], 'center')}
          style={place}
        >
          {title && <strong>{title}</strong>}
          {tip && <span>{tip}</span>}
          {buttonText && <button type="button" className="fp-btn fp-btn-primary" onClick={go}>{buttonText}</button>}
        </div>
      )}
    </>
  );
};

const CloseButton: React.FC<{ ctx: RenderContext }> = ({ ctx }) => (
  <button type="button" className="fp-close" aria-label="Close" onClick={() => ctx.mode !== 'edit' && ctx.onAction?.('close')}>
    ×
  </button>
);

const Banner: Block = ({ node, attrs, children, ctx }) => (
  <div {...withClass(attrs, 'fp-banner')} role="region" aria-label="Announcement">
    {children}
    {Boolean(node.props.dismissible) && <CloseButton ctx={ctx} />}
  </div>
);

const Popup: Block = ({ node, attrs, children, ctx }) => (
  <div {...withClass(attrs, 'fp-popup')} role="dialog" aria-modal="true">
    {children}
    {Boolean(node.props.dismissible) && <CloseButton ctx={ctx} />}
  </div>
);

/**
 * Every slide stays mounted, so forms inside keep their values. The editor's step bar
 * decides which slide it draws, so here it just shows whatever it's given.
 */
const Carousel: Block = ({ node, attrs, children, ctx }) => {
  const count = children.length;
  const isEditing = ctx.mode === 'edit';
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const seconds = Number(node.props.interval) || 0;
  const current = count > 0 ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    if (isEditing || isPaused || seconds <= 0 || count < 2) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), seconds * 1000);
    return () => window.clearInterval(timer);
  }, [isEditing, isPaused, seconds, count]);

  const go = (next: number) => setIndex((next + count) % count);

  // Selecting a block inside another slide, from Layers say, brings that slide into view.
  const contains = (item: RenderNode, id: string): boolean => item.sourceId === id || item.children.some((child) => contains(child, id));
  const selected = isEditing && ctx.selectedId ? node.children.findIndex((child) => contains(child, ctx.selectedId!)) : -1;
  useEffect(() => {
    if (selected >= 0) setIndex(selected);
  }, [selected]);

  return (
    <div
      {...withClass(attrs, 'fp-carousel')}
      role="group"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {children.map((child, i) => (
        <div key={node.children[i].key} style={{ display: i === current ? 'block' : 'none' }} aria-hidden={i !== current}>
          {child}
        </div>
      ))}
      {isEditing && count > 1 && <span className="fp-carousel-count">Slide {current + 1} of {count}</span>}
      {count > 1 && (isEditing || node.props.showArrows !== false) && (
        <>
          <button type="button" className="fp-carousel-arrow" data-side="prev" aria-label="Previous slide" onClick={() => go(current - 1)}>‹</button>
          <button type="button" className="fp-carousel-arrow" data-side="next" aria-label="Next slide" onClick={() => go(current + 1)}>›</button>
        </>
      )}
    </div>
  );
};

/**
 * Two copies side by side make the loop seamless. The second is only there for the look,
 * so it's hidden from screen readers and the keyboard. In the editor it stays still,
 * so every item can be clicked.
 */
const Marquee: Block = ({ node, attrs, children, ctx }) => {
  if (ctx.mode === 'edit') {
    return (
      <div {...withClass(attrs, 'fp-marquee')} data-editing="true">
        <div className="fp-marquee-track">{children}</div>
      </div>
    );
  }
  const seconds = Math.max(5, Number(node.props.speed) || 30);
  return (
    <div {...withClass(attrs, 'fp-marquee')}>
      <div className="fp-marquee-track" data-reverse={node.props.reverse === true || undefined} style={{ animationDuration: `${seconds}s` }}>
        <div className="fp-marquee-set">{children}</div>
        <div className="fp-marquee-set" aria-hidden="true" inert>{children}</div>
      </div>
    </div>
  );
};

export const BLOCK_RENDERERS: Record<string, Block> = {
  Marquee,
  Carousel,
  Slide: container('fp-box fp-slide'),
  Root: container('fp-page'),
  Section,
  Container: container('fp-container'),
  Box: container('fp-box'),
  Card: container('fp-box fp-card'),
  Grid: container('fp-grid'),
  Row: container('fp-row'),
  Heading,
  Text,
  Button,
  Image,
  Video,
  PaymentButton,
  ProjectEmbed,
  Avatar,
  Icon,
  List,
  Quote,
  CodeBlock,
  Callout,
  Table,
  Badge,
  Divider,
  Spacer,
  Navbar,
  Accordion,
  Form,
  FormStep,
  FormField,
  ScaleField,
  TourStep,
  DemoScreen,
  DemoHotspot,
  Banner,
  Popup,
};
