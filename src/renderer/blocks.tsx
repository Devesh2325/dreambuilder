import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { safeImageUrl, safeUrl } from '../core/variables';
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

const TourStep: Block = ({ attrs, children }) => <div {...withClass(attrs, 'fp-step')}>{children}</div>;

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
  const goTo = Number(node.props.goTo);
  return (
    <>
      <button
        type="button"
        {...withClass(attrs, 'fp-hotspot')}
        style={{ left: `${x}%`, top: `${y}%` }}
        aria-label={tip || 'Continue'}
        onClick={() => {
          if (ctx.mode !== 'edit') ctx.onAction?.(goTo > 0 ? 'goto' : 'next', goTo - 1);
        }}
      />
      {tip && <span className="fp-hotspot-tip" style={{ left: `${x}%`, top: `${y}%` }}>{tip}</span>}
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

  return (
    <div
      {...withClass(attrs, 'fp-carousel')}
      role="group"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {children.map((child, i) => (
        <div key={node.children[i].key} style={{ display: isEditing || i === current ? 'block' : 'none' }} aria-hidden={!isEditing && i !== current}>
          {child}
        </div>
      ))}
      {!isEditing && count > 1 && node.props.showArrows !== false && (
        <>
          <button type="button" className="fp-carousel-arrow" data-side="prev" aria-label="Previous slide" onClick={() => go(current - 1)}>‹</button>
          <button type="button" className="fp-carousel-arrow" data-side="next" aria-label="Next slide" onClick={() => go(current + 1)}>›</button>
        </>
      )}
    </div>
  );
};

export const BLOCK_RENDERERS: Record<string, Block> = {
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
