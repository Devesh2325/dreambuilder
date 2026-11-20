// FlowPilot Tour Builder & Live Player - Content Script
// Visual element picker, smart target resolver, inline tooltip editor & on-page tour player
// Uses an isolated Shadow DOM container (#fp-extension-root) so host CSS never interferes.

(function () {
  if (window.__flowpilot_extension_injected) return;
  window.__flowpilot_extension_injected = true;

  // =========================================================================
  // 1. SELECTOR ENGINE & SMART TARGET ELEVATION
  // =========================================================================

  // Exact selector builder from FlowPilot core (tourPosition.ts)
  function selectorFor(element) {
    const stableAttr = ['data-testid', 'data-test', 'data-cy', 'data-tour', 'name', 'aria-label'];
    const parts = [];
    let current = element;

    while (current && current.nodeType === 1 && current !== current.ownerDocument.documentElement) {
      if (current.id && !/\d{3,}/.test(current.id)) {
        parts.unshift(`#${CSS.escape(current.id)}`);
        break;
      }
      const attr = stableAttr.find((name) => current.getAttribute(name));
      if (attr) {
        const value = current.getAttribute(attr).replace(/["\\]/g, '\\$&');
        parts.unshift(`${current.tagName.toLowerCase()}[${attr}="${value}"]`);
        break;
      }
      const tag = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (!parent) {
        parts.unshift(tag);
        break;
      }
      const sameTag = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
      parts.unshift(sameTag.length > 1 ? `${tag}:nth-of-type(${sameTag.indexOf(current) + 1})` : tag);
      current = parent;
    }
    return parts.join(' > ');
  }

  // Selection mode: 'smart' (auto-snaps to cards, buttons, widgets), 'section' (snaps to section/grid), 'exact' (leaf node)
  let selectionMode = 'smart';

  // Elevates clicks on tiny sub-elements (like <svg>, <path>, <span>, <p>) to their parent interactive button or card
  function getSmartTarget(element, mode = selectionMode) {
    if (!element || element.nodeType !== 1) return element;

    // 1. Exact mode returns verbatim hovered element
    if (mode === 'exact') return element;

    // 2. Section mode snaps to larger structural containers
    if (mode === 'section') {
      const section = element.closest('section, main, header, footer, nav, aside, [role="region"], [role="main"], [role="navigation"], [class*="section"], [class*="container"], [class*="grid"], [class*="row"], [class*="layout"]');
      if (section && section !== document.body && section !== document.documentElement) return section;
      return element;
    }

    // 3. Smart mode (default):
    // First, direct interactive controls (buttons, links, inputs, dropdowns)
    const interactive = element.closest('button, a, input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [data-tour], [data-testid], .btn, .button');
    if (interactive) return interactive;

    // Second, metric / stat / KPI card containers (e.g. "Pending Bilty's", stat tiles, dashboard widgets)
    const card = element.closest(
      '[class*="card"], [class*="stat"], [class*="tile"], [class*="metric"], [class*="kpi"], [class*="widget"], [class*="box"], [class*="panel"], [class*="summary"], [class*="item"], [role="region"], [role="article"], article'
    );
    if (card && card !== document.body && card !== document.documentElement) {
      const r = card.getBoundingClientRect();
      // Snap to card if it's a reasonably sized card/tile (between 50px and 900px wide)
      if (r.width >= 50 && r.height >= 30 && r.width <= 900 && r.height <= 700) {
        return card;
      }
    }

    // Third, inner text / icon / badge elevation to parent container
    const tag = element.tagName.toLowerCase();
    if (['svg', 'path', 'g', 'circle', 'rect', 'line', 'polygon', 'polyline', 'span', 'i', 'b', 'strong', 'em', 'small', 'img', 'p', 'label'].includes(tag)) {
      if (element.parentElement && element.parentElement !== document.body && element.parentElement !== document.documentElement) {
        const pr = element.parentElement.getBoundingClientRect();
        if (pr.width >= 30 && pr.height >= 20 && pr.width <= 750 && pr.height <= 500) {
          return element.parentElement;
        }
      }
    }

    return element;
  }

  // Human-friendly description for badge display & default step title
  function describeElement(el) {
    if (!el || el.nodeType !== 1) {
      return { kind: 'Element', label: 'Element', cleanTitle: 'Step', quality: 'standard', selector: '' };
    }
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role') || '';
    const aria = el.getAttribute('aria-label');
    const title = el.getAttribute('title');
    const ph = el.getAttribute('placeholder');
    const cls = (el.className || '').toString().toLowerCase();

    // Determine semantic kind
    let kind = 'Element';
    if (tag === 'button' || role === 'button' || cls.includes('btn') || cls.includes('button')) kind = 'Button';
    else if (tag === 'a' || role === 'link') kind = 'Link';
    else if (tag === 'input') kind = el.type === 'submit' ? 'Submit Button' : `${el.type || 'Text'} Input`;
    else if (tag === 'select') kind = 'Dropdown';
    else if (tag === 'nav' || role === 'navigation') kind = 'Nav Bar';
    else if (tag === 'header') kind = 'Header';
    else if (tag === 'aside' || cls.includes('sidebar')) kind = 'Sidebar';
    else if (tag === 'section' || cls.includes('section')) kind = 'Section';
    else if (cls.includes('card') || cls.includes('stat') || cls.includes('metric') || cls.includes('tile') || cls.includes('kpi') || cls.includes('widget') || cls.includes('box')) kind = 'Card / Widget';
    else if (/^h[1-6]$/.test(tag)) kind = 'Heading';
    else if (cls.includes('profile') || cls.includes('avatar') || el.id?.toLowerCase().includes('profile')) kind = 'Profile';
    else if (cls.includes('table') || tag === 'table') kind = 'Table';

    // Extract smart clean title from inside card or element
    let cleanTitle = '';
    if (kind === 'Card / Widget' || kind === 'Section') {
      const heading = el.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="label"], [class*="name"], strong, b');
      if (heading) {
        cleanTitle = (heading.innerText || '').trim().replace(/\s+/g, ' ');
      }
    }
    if (!cleanTitle) {
      cleanTitle = (aria || title || ph || el.innerText || el.getAttribute('name') || '').trim().replace(/\s+/g, ' ');
    }
    cleanTitle = cleanTitle.slice(0, 32);

    const hasTestId = el.hasAttribute('data-testid') || el.hasAttribute('data-tour');
    const hasId = el.id && !/\d{3,}/.test(el.id);
    const quality = hasTestId ? '🟢 TestID' : hasId ? '🟢 ID' : aria ? '🟢 ARIA' : '🟡 Class';

    return {
      kind,
      label: cleanTitle ? `${kind}: "${cleanTitle}"` : kind,
      cleanTitle: cleanTitle || `${kind} Step`,
      quality,
      selector: selectorFor(el),
    };
  }

  // =========================================================================
  // 2. STATE & SHADOW DOM CONTAINER
  // =========================================================================
  let isRecording = false;
  let isPaused = false;
  let steps = [];
  let currentTourTitle = 'App Onboarding Tour';
  let activeElement = null;
  let hostEl = null;
  let shadowRoot = null;

  // Shadow DOM elements
  let highlightBox = null;
  let tagBadge = null;
  let toolbar = null;
  let inlineEditorContainer = null;
  let livePlayerContainer = null;

  function ensureShadowRoot() {
    if (hostEl && shadowRoot) return;

    hostEl = document.createElement('div');
    hostEl.id = 'fp-extension-root';
    hostEl.style.cssText = 'position:absolute;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
    document.documentElement.appendChild(hostEl);

    shadowRoot = hostEl.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      /* Hover Highlight */
      .fp-highlight {
        position: fixed;
        pointer-events: none;
        border: 2px solid #6366f1;
        background: rgba(99, 102, 241, 0.12);
        border-radius: 8px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5), 0 0 18px rgba(99, 102, 241, 0.45);
        transition: all 0.08s ease-out;
        z-index: 2147483640;
        display: none;
      }

      .fp-badge {
        position: absolute;
        top: -32px;
        left: 0;
        background: #0f172a;
        color: #e2e8f0;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid #4338ca;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 4px 14px rgba(0,0,0,0.45);
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .fp-badge-nav {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: 6px;
        border-left: 1px solid rgba(255, 255, 255, 0.2);
        padding-left: 6px;
      }

      .fp-key-pill {
        font-size: 9px;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.15);
        color: #cbd5e1;
      }

      .fp-quality-pill {
        font-size: 9px;
        font-weight: 700;
        padding: 1px 5px;
        border-radius: 4px;
        background: rgba(99, 102, 241, 0.25);
        color: #a5b4fc;
      }

      /* Floating Bottom Toolbar */
      .fp-toolbar-wrap {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        pointer-events: auto;
      }

      .fp-toolbar {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #0f172a;
        color: #f8fafc;
        padding: 8px 14px;
        border-radius: 9999px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(99, 102, 241, 0.3);
        backdrop-filter: blur(16px);
      }

      .fp-mode-group {
        display: flex;
        background: rgba(255, 255, 255, 0.08);
        padding: 2px;
        border-radius: 9999px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        gap: 2px;
      }

      .fp-mode-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .fp-mode-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
      }

      .fp-mode-btn.active {
        background: #4f46e5;
        color: #fff;
        box-shadow: 0 1px 6px rgba(79, 70, 229, 0.4);
      }

      .fp-brand {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
        padding-right: 10px;
        border-right: 1px solid rgba(255, 255, 255, 0.18);
      }

      .fp-logo-icon {
        width: 20px;
        height: 20px;
        border-radius: 5px;
        background: linear-gradient(135deg, #4f46e5, #9333ea);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 900;
      }

      .fp-counter {
        background: rgba(99, 102, 241, 0.25);
        color: #c7d2fe;
        font-size: 12px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 12px;
        border: 1px solid rgba(99, 102, 241, 0.4);
      }

      .fp-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.08);
        color: #f1f5f9;
        font-size: 12px;
        font-weight: 600;
        padding: 6px 14px;
        border-radius: 9999px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .fp-btn:hover {
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
      }

      .fp-btn.primary {
        background: #4f46e5;
        border-color: #6366f1;
        color: #fff;
        box-shadow: 0 2px 10px rgba(79, 70, 229, 0.45);
      }

      .fp-btn.primary:hover {
        background: #4338ca;
      }

      .fp-btn.success {
        background: #059669;
        border-color: #10b981;
        color: #fff;
      }

      .fp-btn.danger {
        color: #fca5a5;
      }
      .fp-btn.danger:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #fee2e2;
      }

      /* Inline Tooltip Editor (snapped right on the clicked element) */
      .fp-inline-tooltip {
        position: fixed;
        width: 320px;
        background: #0f172a;
        color: #f8fafc;
        border-radius: 14px;
        padding: 16px;
        border: 1px solid rgba(99, 102, 241, 0.4);
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1);
        z-index: 2147483646;
        pointer-events: auto;
        animation: fpFadeIn 0.15s ease-out;
      }

      @keyframes fpFadeIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }

      .fp-tooltip-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .fp-tooltip-badge {
        font-size: 11px;
        font-weight: 700;
        color: #a5b4fc;
        background: rgba(99, 102, 241, 0.2);
        padding: 2px 8px;
        border-radius: 6px;
      }

      .fp-tooltip-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 16px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .fp-tooltip-close:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
      }

      .fp-tooltip-input {
        width: 100%;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 13px;
        font-weight: 600;
        color: #fff;
        outline: none;
        margin-bottom: 8px;
      }
      .fp-tooltip-input:focus {
        border-color: #6366f1;
      }

      .fp-tooltip-textarea {
        width: 100%;
        height: 60px;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 12px;
        color: #cbd5e1;
        outline: none;
        resize: none;
        margin-bottom: 10px;
      }
      .fp-tooltip-textarea:focus {
        border-color: #6366f1;
      }

      .fp-tooltip-meta-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 11px;
        color: #94a3b8;
      }

      .fp-placement-group {
        display: flex;
        gap: 3px;
        background: #1e293b;
        padding: 2px;
        border-radius: 6px;
      }

      .fp-placement-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 10px;
        padding: 3px 6px;
        border-radius: 4px;
        cursor: pointer;
      }
      .fp-placement-btn.active {
        background: #4f46e5;
        color: #fff;
      }

      .fp-target-adjust {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .fp-btn-adjust {
        background: #1e293b;
        border: 1px solid #334155;
        color: #94a3b8;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
      }
      .fp-btn-adjust:hover {
        color: #fff;
        border-color: #6366f1;
      }

      .fp-tooltip-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      /* LIVE TOUR PLAYER ON PAGE */
      .fp-player-scrim {
        position: fixed;
        inset: 0;
        background: transparent;
        z-index: 2147483644;
        pointer-events: auto;
      }

      .fp-player-spotlight {
        position: fixed;
        border: 2px solid #6366f1;
        border-radius: 12px;
        box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.38), 0 0 24px rgba(99, 102, 241, 0.55);
        z-index: 2147483645;
        pointer-events: none;
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .fp-player-spotlight.fp-dim-off {
        box-shadow: 0 0 0 2px #818cf8, 0 0 20px rgba(99, 102, 241, 0.4);
      }

      .fp-player-card {
        position: fixed;
        width: 340px;
        background: #0f172a;
        color: #f8fafc;
        border-radius: 16px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
        z-index: 2147483646;
        pointer-events: auto;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .fp-player-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .fp-player-title {
        font-size: 16px;
        font-weight: 700;
        color: #fff;
        line-height: 1.3;
        margin-bottom: 6px;
      }

      .fp-player-desc {
        font-size: 13px;
        color: #cbd5e1;
        line-height: 1.5;
        margin-bottom: 16px;
      }

      .fp-player-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .fp-player-step-indicator {
        font-size: 12px;
        color: #94a3b8;
        font-weight: 600;
      }
    `;

    shadowRoot.appendChild(style);

    // Highlight element box
    highlightBox = document.createElement('div');
    highlightBox.className = 'fp-highlight';
    tagBadge = document.createElement('div');
    tagBadge.className = 'fp-badge';
    highlightBox.appendChild(tagBadge);
    shadowRoot.appendChild(highlightBox);

    // Bottom floating toolbar
    const toolbarWrap = document.createElement('div');
    toolbarWrap.className = 'fp-toolbar-wrap';
    toolbar = document.createElement('div');
    toolbar.className = 'fp-toolbar';
    toolbarWrap.appendChild(toolbar);
    shadowRoot.appendChild(toolbarWrap);

    // Inline Editor container
    inlineEditorContainer = document.createElement('div');
    shadowRoot.appendChild(inlineEditorContainer);

    // Live Player container
    livePlayerContainer = document.createElement('div');
    shadowRoot.appendChild(livePlayerContainer);
  }

  // =========================================================================
  // 3. VISUAL RECORDING & INLINE STEP EDITOR
  // =========================================================================

  let hoveredRaw = null;
  let hierarchyStack = [];

  function renderHighlight(target) {
    if (!target || !target.getBoundingClientRect || !highlightBox || !tagBadge) return;
    const rect = target.getBoundingClientRect();
    const desc = describeElement(target);

    highlightBox.style.display = 'block';
    highlightBox.style.top = `${rect.top}px`;
    highlightBox.style.left = `${rect.left}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;

    // Position badge above or below depending on available space
    if (rect.top < 36) {
      tagBadge.style.top = 'auto';
      tagBadge.style.bottom = '-34px';
    } else {
      tagBadge.style.top = '-34px';
      tagBadge.style.bottom = 'auto';
    }

    tagBadge.innerHTML = `
      <span>${desc.label}</span>
      <span class="fp-quality-pill">${desc.quality}</span>
      <div class="fp-badge-nav">
        <span class="fp-key-pill" title="Press Up Arrow to expand to parent section">↑ Parent</span>
        <span class="fp-key-pill" title="Press Enter or Click to pick this element">↵ Pick</span>
      </div>
    `;
  }

  function renderToolbar() {
    if (!toolbar) return;

    toolbar.innerHTML = `
      <div class="fp-brand">
        <div class="fp-logo-icon">FP</div>
        <span>${isPaused ? 'Navigate Mode' : 'Recording'}</span>
      </div>

      <div class="fp-mode-group" title="Target Selection Mode (Hotkeys: 1, 2, 3)">
        <button class="fp-mode-btn ${selectionMode === 'smart' ? 'active' : ''}" data-mode="smart" title="Auto-snaps to entire cards, widgets and buttons (Press 1)">🎯 Card Snap</button>
        <button class="fp-mode-btn ${selectionMode === 'section' ? 'active' : ''}" data-mode="section" title="Snaps to large section / container grids (Press 2)">📦 Section</button>
        <button class="fp-mode-btn ${selectionMode === 'exact' ? 'active' : ''}" data-mode="exact" title="Select exact hovered leaf element (Press 3)">🔍 Exact</button>
      </div>

      <span class="fp-counter">${steps.length} step${steps.length === 1 ? '' : 's'}</span>
      <button class="fp-btn" id="fp-tb-toggle-mode">
        <span>${isPaused ? '🎯 Click to Add Steps' : '🧭 Use / Navigate App'}</span>
      </button>
      ${steps.length > 0 ? `
        <button class="fp-btn" id="fp-tb-test-live">
          <span>▶ Play Test</span>
        </button>
      ` : ''}
      <button class="fp-btn primary" id="fp-tb-save">
        <span>✓ Save to FlowPilot</span>
      </button>
      <button class="fp-btn danger" id="fp-tb-close" title="Exit recording">✕</button>
    `;

    shadowRoot.querySelectorAll('.fp-mode-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectionMode = btn.dataset.mode;
        renderToolbar();
        if (hoveredRaw) {
          activeElement = getSmartTarget(hoveredRaw, selectionMode);
          hierarchyStack = [];
          renderHighlight(activeElement);
        }
      });
    });

    shadowRoot.getElementById('fp-tb-toggle-mode')?.addEventListener('click', () => {
      isPaused = !isPaused;
      if (highlightBox) highlightBox.style.display = 'none';
      renderToolbar();
      notifyState();
    });

    shadowRoot.getElementById('fp-tb-test-live')?.addEventListener('click', () => {
      startLiveTourPlayer({ title: currentTourTitle, steps });
    });

    shadowRoot.getElementById('fp-tb-save')?.addEventListener('click', () => {
      exportToFlowPilot();
    });

    shadowRoot.getElementById('fp-tb-close')?.addEventListener('click', () => {
      stopRecording();
    });
  }

  function handleMouseMove(e) {
    if (!isRecording || isPaused) return;

    const raw = e.target;
    if (!raw || raw === hostEl || hostEl?.contains(raw)) return;

    hoveredRaw = raw;
    const target = getSmartTarget(raw, selectionMode);
    activeElement = target;
    hierarchyStack = [];

    renderHighlight(target);
  }

  function handleClick(e) {
    if (!isRecording || isPaused) return;

    const raw = e.target;
    if (!raw || raw === hostEl || hostEl?.contains(raw)) return;

    e.preventDefault();
    e.stopPropagation();

    const target = activeElement || getSmartTarget(raw, selectionMode);
    activeElement = target;

    openInlineStepEditor(target);
  }

  // Opens the inline tooltip directly next to the clicked element
  function openInlineStepEditor(target) {
    if (!inlineEditorContainer) return;

    const desc = describeElement(target);
    let currentPlacement = 'bottom';
    let targetEl = target;
    let localHierarchy = [];

    // Calculate position
    const updateEditorPosition = (side) => {
      currentPlacement = side;
      const editor = shadowRoot.querySelector('.fp-inline-tooltip');
      if (!editor || !targetEl || !targetEl.getBoundingClientRect) return;

      const rect = targetEl.getBoundingClientRect();
      const edWidth = 320;
      const edHeight = 220;
      const gap = 12;

      let top = rect.bottom + gap;
      let left = rect.left + rect.width / 2 - edWidth / 2;

      if (side === 'top') {
        top = rect.top - edHeight - gap;
      } else if (side === 'left') {
        top = rect.top + rect.height / 2 - edHeight / 2;
        left = rect.left - edWidth - gap;
      } else if (side === 'right') {
        top = rect.top + rect.height / 2 - edHeight / 2;
        left = rect.right + gap;
      }

      // Clamp to viewport
      top = Math.max(16, Math.min(window.innerHeight - edHeight - 16, top));
      left = Math.max(16, Math.min(window.innerWidth - edWidth - 16, left));

      editor.style.top = `${top}px`;
      editor.style.left = `${left}px`;

      // Update active placement button
      shadowRoot.querySelectorAll('.fp-placement-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.side === side);
      });
    };

    const initialTitle = desc.cleanTitle || `${desc.kind} Step`;

    inlineEditorContainer.innerHTML = `
      <div class="fp-inline-tooltip">
        <div class="fp-tooltip-header">
          <span class="fp-tooltip-badge">✨ Step #${steps.length + 1}: ${desc.kind}</span>
          <button class="fp-tooltip-close" id="fp-ed-close">✕</button>
        </div>

        <input class="fp-tooltip-input" id="fp-ed-title" value="${initialTitle.replace(/"/g, '&quot;')}" placeholder="Step Title..." autofocus />
        <textarea class="fp-tooltip-textarea" id="fp-ed-desc" placeholder="Explain what to do here (e.g. Click to filter transactions)..."></textarea>

        <div class="fp-tooltip-meta-row">
          <div class="fp-placement-group">
            <button class="fp-placement-btn" data-side="top">▲ Top</button>
            <button class="fp-placement-btn active" data-side="bottom">▼ Bottom</button>
            <button class="fp-placement-btn" data-side="left">◀ Left</button>
            <button class="fp-placement-btn" data-side="right">▶ Right</button>
          </div>

          <div class="fp-target-adjust">
            <button class="fp-btn-adjust" id="fp-ed-parent" title="Expand to parent section container">▲ Parent</button>
            <button class="fp-btn-adjust" id="fp-ed-child" title="Shrink to inner element">▼ Child</button>
          </div>
        </div>

        <div class="fp-tooltip-actions">
          <button class="fp-btn primary" id="fp-ed-add-next">
            <span>✓ Add Step & Pick Next</span>
          </button>
          <button class="fp-btn success" id="fp-ed-save-finish">
            <span>Save & Finish</span>
          </button>
        </div>
      </div>
    `;

    setTimeout(() => updateEditorPosition('bottom'), 10);

    const titleInput = shadowRoot.getElementById('fp-ed-title');
    const descInput = shadowRoot.getElementById('fp-ed-desc');
    titleInput?.focus();
    titleInput?.select();

    // Placement changes
    shadowRoot.querySelectorAll('.fp-placement-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateEditorPosition(btn.dataset.side);
      });
    });

    // Parent target adjustment
    shadowRoot.getElementById('fp-ed-parent')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (targetEl.parentElement && targetEl.parentElement !== document.body && targetEl.parentElement !== document.documentElement) {
        localHierarchy.push(targetEl);
        targetEl = targetEl.parentElement;
        const newDesc = describeElement(targetEl);
        renderHighlight(targetEl);
        updateEditorPosition(currentPlacement);

        if (titleInput && (!titleInput.value || titleInput.value === initialTitle)) {
          titleInput.value = newDesc.cleanTitle || `${newDesc.kind} Step`;
        }
        const badge = shadowRoot.querySelector('.fp-tooltip-badge');
        if (badge) badge.textContent = `✨ Step #${steps.length + 1}: ${newDesc.kind}`;
      }
    });

    // Child target adjustment
    shadowRoot.getElementById('fp-ed-child')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (localHierarchy.length > 0) {
        targetEl = localHierarchy.pop();
        const newDesc = describeElement(targetEl);
        renderHighlight(targetEl);
        updateEditorPosition(currentPlacement);

        if (titleInput) {
          titleInput.value = newDesc.cleanTitle || `${newDesc.kind} Step`;
        }
        const badge = shadowRoot.querySelector('.fp-tooltip-badge');
        if (badge) badge.textContent = `✨ Step #${steps.length + 1}: ${newDesc.kind}`;
      }
    });

    // Save and continue picking next step immediately
    const saveStep = (andFinish = false) => {
      const step = {
        selector: selectorFor(targetEl),
        title: titleInput?.value.trim() || initialTitle,
        text: titleInput?.value.trim() || initialTitle,
        description: descInput?.value.trim() || 'Tell people what this does.',
        path: window.location.pathname,
        placement: currentPlacement,
        tagName: targetEl.tagName.toLowerCase(),
      };

      steps.push(step);
      saveSteps();
      closeInlineEditor();
      renderToolbar();
      notifyState();

      if (andFinish) {
        exportToFlowPilot();
      }
    };

    const closeInlineEditor = () => {
      inlineEditorContainer.innerHTML = '';
    };

    shadowRoot.getElementById('fp-ed-add-next')?.addEventListener('click', () => saveStep(false));
    shadowRoot.getElementById('fp-ed-save-finish')?.addEventListener('click', () => saveStep(true));
    shadowRoot.getElementById('fp-ed-close')?.addEventListener('click', closeInlineEditor);

    titleInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveStep(false);
      if (e.key === 'Escape') closeInlineEditor();
    });
  }

  // =========================================================================
  // 4. ON-PAGE LIVE TOUR RUNNER / PLAYER
  // =========================================================================

  let activeTourPlayer = null;

  function startLiveTourPlayer(tour) {
    if (!tour || !Array.isArray(tour.steps) || tour.steps.length === 0) {
      alert('This tour has no steps to play.');
      return;
    }

    ensureShadowRoot();
    stopLiveTourPlayer();

    let currentStepIdx = 0;
    const totalSteps = tour.steps.length;
    let dimEnabled = true;

    // Build spotlight + card container
    livePlayerContainer.innerHTML = `
      <div class="fp-player-scrim" id="fp-scrim"></div>
      <div class="fp-player-spotlight" id="fp-spotlight"></div>
      <div class="fp-player-card" id="fp-card">
        <div class="fp-player-top">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="fp-counter">${tour.title || 'Tour'}</span>
            <button class="fp-btn-adjust" id="fp-player-dim-toggle" title="Toggle backdrop dimming" style="font-size:11px;padding:2px 8px;border-radius:6px;cursor:pointer;">💡 Dim: On</button>
          </div>
          <button class="fp-tooltip-close" id="fp-player-close">✕</button>
        </div>
        <h3 class="fp-player-title" id="fp-player-headline">Step Title</h3>
        <p class="fp-player-desc" id="fp-player-body">Step description goes here...</p>
        <div class="fp-player-nav">
          <span class="fp-player-step-indicator" id="fp-player-progress">Step 1 of ${totalSteps}</span>
          <div style="display:flex;gap:6px;">
            <button class="fp-btn" id="fp-player-prev">Back</button>
            <button class="fp-btn primary" id="fp-player-next">Next →</button>
          </div>
        </div>
      </div>
    `;

    const scrim = shadowRoot.getElementById('fp-scrim');
    const spotlight = shadowRoot.getElementById('fp-spotlight');
    const card = shadowRoot.getElementById('fp-card');
    const headline = shadowRoot.getElementById('fp-player-headline');
    const body = shadowRoot.getElementById('fp-player-body');
    const progress = shadowRoot.getElementById('fp-player-progress');
    const prevBtn = shadowRoot.getElementById('fp-player-prev');
    const nextBtn = shadowRoot.getElementById('fp-player-next');
    const closeBtn = shadowRoot.getElementById('fp-player-close');
    const dimToggleBtn = shadowRoot.getElementById('fp-player-dim-toggle');

    dimToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dimEnabled = !dimEnabled;
      spotlight.classList.toggle('fp-dim-off', !dimEnabled);
      if (dimToggleBtn) dimToggleBtn.textContent = dimEnabled ? '💡 Dim: On' : '💡 Dim: Off';
    });

    function renderStep(idx) {
      if (idx < 0 || idx >= totalSteps) {
        finishTour();
        return;
      }

      currentStepIdx = idx;
      const step = tour.steps[idx];

      headline.textContent = step.title || step.text || `Step ${idx + 1}`;
      body.textContent = step.description || '';
      progress.textContent = `Step ${idx + 1} of ${totalSteps}`;

      prevBtn.style.display = idx === 0 ? 'none' : 'inline-flex';
      nextBtn.textContent = idx === totalSteps - 1 ? '🎉 Finish Tour' : 'Next Step →';

      spotlight.classList.toggle('fp-dim-off', !dimEnabled);

      // Find target element
      let el = null;
      if (step.selector) {
        try {
          el = document.querySelector(step.selector);
        } catch {
          el = null;
        }
      }

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = el.getBoundingClientRect();
        const pad = 8;

        spotlight.style.display = 'block';
        spotlight.style.top = `${rect.top - pad}px`;
        spotlight.style.left = `${rect.left - pad}px`;
        spotlight.style.width = `${rect.width + pad * 2}px`;
        spotlight.style.height = `${rect.height + pad * 2}px`;

        // Position card next to target
        const cardWidth = 340;
        const cardHeight = 180;
        let cTop = rect.bottom + 16;
        let cLeft = rect.left + rect.width / 2 - cardWidth / 2;

        if (step.placement === 'top' || (cTop + cardHeight > window.innerHeight && rect.top > cardHeight + 20)) {
          cTop = rect.top - cardHeight - 16;
        }

        cTop = Math.max(16, Math.min(window.innerHeight - cardHeight - 16, cTop));
        cLeft = Math.max(16, Math.min(window.innerWidth - cardWidth - 16, cLeft));

        card.style.top = `${cTop}px`;
        card.style.left = `${cLeft}px`;
        card.style.transform = 'none';

        // Auto-advance if user clicks the actual target on their page
        const onTargetClick = () => {
          el.removeEventListener('click', onTargetClick);
          renderStep(currentStepIdx + 1);
        };
        el.addEventListener('click', onTargetClick, { once: true });
      } else {
        // Center card if target missing
        spotlight.style.display = 'none';
        card.style.top = '50%';
        card.style.left = '50%';
        card.style.transform = 'translate(-50%, -50%)';
      }
    }

    function finishTour() {
      stopLiveTourPlayer();
      // Show celebratory confirmation
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#059669;color:#fff;padding:10px 20px;border-radius:12px;font:700 13px system-ui;box-shadow:0 10px 30px rgba(0,0,0,0.5);display:flex;align-items:center;gap:8px;';
      toast.innerHTML = '<span>🎉</span><span>Tour finished successfully on your platform!</span>';
      shadowRoot.appendChild(toast);
      setTimeout(() => toast.remove(), 3500);
    }

    prevBtn?.addEventListener('click', () => renderStep(currentStepIdx - 1));
    nextBtn?.addEventListener('click', () => renderStep(currentStepIdx + 1));
    closeBtn?.addEventListener('click', stopLiveTourPlayer);
    scrim?.addEventListener('click', stopLiveTourPlayer);

    renderStep(0);
    activeTourPlayer = { stop: stopLiveTourPlayer };
  }

  function stopLiveTourPlayer() {
    if (livePlayerContainer) livePlayerContainer.innerHTML = '';
    activeTourPlayer = null;
  }

  // =========================================================================
  // 5. LIFECYCLE & SYNC
  // =========================================================================

  function startRecording(initialSteps = [], options = {}) {
    ensureShadowRoot();
    isRecording = true;
    isPaused = false;
    steps = initialSteps || [];

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    if (hostEl) hostEl.style.display = 'block';
    renderToolbar();
    notifyState();
  }

  function stopRecording() {
    isRecording = false;
    isPaused = false;

    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);

    if (highlightBox) highlightBox.style.display = 'none';
    if (inlineEditorContainer) inlineEditorContainer.innerHTML = '';
    if (toolbar) toolbar.innerHTML = '';
    notifyState();
  }

  function handleKeyDown(e) {
    if (!isRecording) return;

    // If inline tooltip editor is active, Escape cancels it
    if (inlineEditorContainer?.innerHTML) {
      if (e.key === 'Escape') {
        inlineEditorContainer.innerHTML = '';
      }
      return;
    }

    if (e.key === 'Escape') {
      isPaused = !isPaused;
      if (highlightBox) highlightBox.style.display = 'none';
      renderToolbar();
      notifyState();
      return;
    }

    // Expand to parent container on ArrowUp or 'w' / 'W'
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      if (activeElement && activeElement.parentElement && activeElement.parentElement !== document.body && activeElement.parentElement !== document.documentElement) {
        e.preventDefault();
        hierarchyStack.push(activeElement);
        activeElement = activeElement.parentElement;
        renderHighlight(activeElement);
      }
      return;
    }

    // Shrink to child on ArrowDown or 's' / 'S'
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      if (hierarchyStack.length > 0) {
        e.preventDefault();
        activeElement = hierarchyStack.pop();
        renderHighlight(activeElement);
      }
      return;
    }

    // Pick and open editor on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      if (activeElement && !isPaused) {
        e.preventDefault();
        openInlineStepEditor(activeElement);
      }
      return;
    }

    // Selection mode quick hotkeys (1: Smart Card, 2: Section, 3: Exact)
    if (e.key === '1') {
      selectionMode = 'smart';
      renderToolbar();
      if (hoveredRaw) {
        activeElement = getSmartTarget(hoveredRaw, selectionMode);
        hierarchyStack = [];
        renderHighlight(activeElement);
      }
    } else if (e.key === '2') {
      selectionMode = 'section';
      renderToolbar();
      if (hoveredRaw) {
        activeElement = getSmartTarget(hoveredRaw, selectionMode);
        hierarchyStack = [];
        renderHighlight(activeElement);
      }
    } else if (e.key === '3') {
      selectionMode = 'exact';
      renderToolbar();
      if (hoveredRaw) {
        activeElement = getSmartTarget(hoveredRaw, selectionMode);
        hierarchyStack = [];
        renderHighlight(activeElement);
      }
    }
  }

  function saveSteps() {
    chrome.storage.local.set({
      flowpilot_recorded_steps: steps,
      flowpilot_last_site: window.location.href,
    });
  }

  function notifyState() {
    chrome.runtime.sendMessage({
      type: 'FP_STATE_UPDATED',
      payload: {
        isRecording,
        isPaused,
        stepCount: steps.length,
        steps,
      },
    }).catch(() => undefined);
  }

  function exportToFlowPilot() {
    if (steps.length === 0) {
      alert('Please click at least one element to add a tour step before saving.');
      return;
    }

    chrome.storage.local.get(['flowpilot_dashboard_url', 'flowpilot_current_tour_title', 'flowpilot_workspace_tours'], (res) => {
      const dashboardBase = res.flowpilot_dashboard_url || 'https://dreambuilder-two.vercel.app';
      const cleanBase = dashboardBase.replace(/\/+$/, '');
      const tourTitle = res.flowpilot_current_tour_title || `${document.title || 'App'} Onboarding Tour`;

      const payload = {
        type: 'tour',
        title: tourTitle,
        builderUrl: window.location.href,
        steps: steps.map((s) => ({
          selector: s.selector,
          title: s.title || s.text || 'Step',
          text: s.text || s.title || 'Step',
          description: s.description || '',
          path: s.path || window.location.pathname,
          placement: s.placement || 'bottom',
        })),
        createdAt: new Date().toISOString(),
      };

      // Also save to extension's local list
      const existing = res.flowpilot_workspace_tours || [];
      const updated = [{ id: `tour_${Date.now()}`, ...payload, domain: window.location.hostname }, ...existing];
      chrome.storage.local.set({ flowpilot_workspace_tours: updated });

      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const targetUrl = `${cleanBase}/create?type=tour#fp-extension-import=${encoded}`;

      window.open(targetUrl, '_blank');
      stopRecording();
    });
  }

  // =========================================================================
  // 6. MESSAGING INTERFACE
  // =========================================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'START_RECORDING':
        currentTourTitle = message.tourTitle || 'App Onboarding Tour';
        startRecording(message.steps || [], message.options || {});
        sendResponse({ success: true, count: steps.length });
        break;

      case 'STOP_RECORDING':
        stopRecording();
        sendResponse({ success: true });
        break;

      case 'TOGGLE_PAUSE':
        isPaused = !isPaused;
        if (highlightBox) highlightBox.style.display = 'none';
        renderToolbar();
        notifyState();
        sendResponse({ success: true, isPaused });
        break;

      case 'PLAY_TOUR':
        startLiveTourPlayer(message.tour);
        sendResponse({ success: true });
        break;

      case 'STOP_TOUR':
        stopLiveTourPlayer();
        sendResponse({ success: true });
        break;

      case 'GET_STATUS':
        sendResponse({
          isRecording,
          isPaused,
          stepCount: steps.length,
          steps,
          url: window.location.href,
        });
        break;

      case 'CLEAR_STEPS':
        steps = [];
        saveSteps();
        renderToolbar();
        sendResponse({ success: true });
        break;

      case 'HIGHLIGHT_STEP':
        if (message.selector) {
          try {
            const el = document.querySelector(message.selector);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              ensureShadowRoot();
              const rect = el.getBoundingClientRect();
              highlightBox.style.display = 'block';
              highlightBox.style.top = `${rect.top}px`;
              highlightBox.style.left = `${rect.left}px`;
              highlightBox.style.width = `${rect.width}px`;
              highlightBox.style.height = `${rect.height}px`;
              tagBadge.textContent = `Target: ${message.selector}`;
              setTimeout(() => {
                if (!isRecording && highlightBox) highlightBox.style.display = 'none';
              }, 3000);
            }
          } catch (e) {
            console.warn('[FlowPilot] Could not find element', message.selector, e);
          }
        }
        sendResponse({ success: true });
        break;

      case 'EXPORT_STEPS':
        exportToFlowPilot();
        sendResponse({ success: true });
        break;
    }
    return true;
  });

  // Check if we were already recording on this tab
  chrome.storage.local.get(['flowpilot_recording_active', 'flowpilot_recorded_steps', 'flowpilot_current_tour_title'], (res) => {
    if (res.flowpilot_recording_active) {
      currentTourTitle = res.flowpilot_current_tour_title || 'App Onboarding Tour';
      startRecording(res.flowpilot_recorded_steps || []);
    }
  });
})();
