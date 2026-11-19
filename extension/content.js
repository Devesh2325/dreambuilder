// FlowPilot Tour Builder - Content Script
// Visual element picker and step recorder with isolated Shadow DOM UI

(function () {
  // Prevent duplicate injection
  if (window.__flowpilot_extension_injected) return;
  window.__flowpilot_extension_injected = true;

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

  // State
  let isRecording = false;
  let isPaused = false;
  let steps = [];
  let hoveredElement = null;
  let toolbarMinimized = false;
  let hostEl = null;
  let shadowRoot = null;

  // Shadow DOM elements
  let highlightBox = null;
  let tagBadge = null;
  let toolbar = null;
  let modalContainer = null;

  // Initialize Shadow DOM root
  function ensureShadowRoot() {
    if (hostEl && shadowRoot) return;

    hostEl = document.createElement('div');
    hostEl.id = 'fp-extension-root';
    hostEl.style.cssText = 'position:absolute;top:0;left:0;width:0;height:0;z-index:2147483647;pointer-events:none;';
    document.documentElement.appendChild(hostEl);

    shadowRoot = hostEl.attachShadow({ mode: 'open' });

    // Injected styles inside Shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .fp-highlight {
        position: fixed;
        pointer-events: none;
        border: 2px solid #6366f1;
        background: rgba(99, 102, 241, 0.16);
        border-radius: 4px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4), 0 4px 20px rgba(79, 70, 229, 0.35);
        transition: all 0.08s ease-out;
        z-index: 2147483640;
        display: none;
      }

      .fp-badge {
        position: absolute;
        top: -26px;
        left: 0;
        background: #1e1b4b;
        color: #e0e7ff;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid #4338ca;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }

      .fp-toolbar-wrap {
        position: fixed;
        bottom: 20px;
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
        padding: 8px 12px;
        border-radius: 9999px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.2);
        backdrop-filter: blur(12px);
      }

      .fp-brand {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 700;
        color: #fff;
        padding-right: 8px;
        border-right: 1px solid rgba(255, 255, 255, 0.15);
      }

      .fp-logo-icon {
        width: 18px;
        height: 18px;
        border-radius: 4px;
        background: linear-gradient(135deg, #4f46e5, #9333ea);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 900;
      }

      .fp-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 8px #22c55e;
      }

      .fp-status-dot.paused {
        background: #f59e0b;
        box-shadow: 0 0 8px #f59e0b;
      }

      .fp-counter {
        background: rgba(99, 102, 241, 0.2);
        color: #a5b4fc;
        font-size: 12px;
        font-weight: 600;
        padding: 2px 8px;
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
        padding: 6px 12px;
        border-radius: 9999px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .fp-btn:hover {
        background: rgba(255, 255, 255, 0.16);
        color: #fff;
      }

      .fp-btn.primary {
        background: #4f46e5;
        border-color: #6366f1;
        color: #fff;
        box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);
      }

      .fp-btn.primary:hover {
        background: #4338ca;
      }

      .fp-btn.active {
        background: #059669;
        border-color: #10b981;
      }

      .fp-btn.warning {
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
        border-color: rgba(245, 158, 11, 0.3);
      }

      .fp-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        z-index: 2147483646;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
      }

      .fp-modal {
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 20px;
        width: 380px;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.6);
      }

      .fp-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14px;
      }

      .fp-modal-title {
        font-size: 15px;
        font-weight: 700;
        color: #fff;
      }

      .fp-field {
        margin-bottom: 12px;
      }

      .fp-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #94a3b8;
        margin-bottom: 4px;
      }

      .fp-input, .fp-textarea {
        width: 100%;
        background: #1e293b;
        color: #fff;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 8px 10px;
        font-size: 13px;
        outline: none;
      }

      .fp-input:focus, .fp-textarea:focus {
        border-color: #6366f1;
      }

      .fp-textarea {
        resize: vertical;
        min-height: 60px;
      }

      .fp-selector-preview {
        background: #090d16;
        border: 1px solid #1e293b;
        border-radius: 6px;
        padding: 6px 8px;
        font-family: monospace;
        font-size: 11px;
        color: #a5b4fc;
        overflow-x: auto;
        white-space: nowrap;
      }

      .fp-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 16px;
      }
    `;

    shadowRoot.appendChild(style);

    // Highlight box
    highlightBox = document.createElement('div');
    highlightBox.className = 'fp-highlight';
    tagBadge = document.createElement('div');
    tagBadge.className = 'fp-badge';
    highlightBox.appendChild(tagBadge);
    shadowRoot.appendChild(highlightBox);

    // Toolbar wrapper
    const wrap = document.createElement('div');
    wrap.className = 'fp-toolbar-wrap';
    toolbar = document.createElement('div');
    toolbar.className = 'fp-toolbar';
    wrap.appendChild(toolbar);
    shadowRoot.appendChild(wrap);

    // Modal container
    modalContainer = document.createElement('div');
    shadowRoot.appendChild(modalContainer);

    renderToolbar();
  }

  function renderToolbar() {
    if (!toolbar) return;

    if (toolbarMinimized) {
      toolbar.innerHTML = `
        <div class="fp-brand">
          <div class="fp-logo-icon">F</div>
          <span>FlowPilot</span>
        </div>
        <div class="fp-status-dot ${isPaused ? 'paused' : ''}"></div>
        <div class="fp-counter">${steps.length}</div>
        <button class="fp-btn" id="fp-btn-maximize">Expand 🔼</button>
      `;
      shadowRoot.getElementById('fp-btn-maximize')?.addEventListener('click', () => {
        toolbarMinimized = false;
        renderToolbar();
      });
      return;
    }

    toolbar.innerHTML = `
      <div class="fp-brand">
        <div class="fp-logo-icon">F</div>
        <span>FlowPilot Tour</span>
      </div>
      <div class="fp-status-dot ${isPaused ? 'paused' : ''}" title="${isPaused ? 'Paused - navigating' : 'Active - click to record'}"></div>
      <div class="fp-counter" title="${steps.length} steps recorded">${steps.length} ${steps.length === 1 ? 'step' : 'steps'}</div>

      <button class="fp-btn ${isPaused ? 'warning' : 'active'}" id="fp-btn-mode">
        ${isPaused ? '🧭 Navigate mode' : '🎯 Picking elements'}
      </button>

      ${steps.length > 0 ? `
        <button class="fp-btn" id="fp-btn-undo" title="Remove last recorded step">↩ Undo</button>
      ` : ''}

      <button class="fp-btn primary" id="fp-btn-finish">
        🚀 Save & Open Studio
      </button>

      <button class="fp-btn" id="fp-btn-minimize" title="Minimize toolbar">_</button>
      <button class="fp-btn" id="fp-btn-close" title="Cancel & close tour builder">✕</button>
    `;

    // Event listeners
    shadowRoot.getElementById('fp-btn-mode')?.addEventListener('click', () => {
      isPaused = !isPaused;
      if (highlightBox) highlightBox.style.display = 'none';
      renderToolbar();
      notifyState();
    });

    shadowRoot.getElementById('fp-btn-undo')?.addEventListener('click', () => {
      if (steps.length > 0) {
        steps.pop();
        saveSteps();
        renderToolbar();
        notifyState();
      }
    });

    shadowRoot.getElementById('fp-btn-finish')?.addEventListener('click', () => {
      exportToFlowPilot();
    });

    shadowRoot.getElementById('fp-btn-minimize')?.addEventListener('click', () => {
      toolbarMinimized = true;
      renderToolbar();
    });

    shadowRoot.getElementById('fp-btn-close')?.addEventListener('click', () => {
      stopRecording();
    });
  }

  // Hover effect on host elements
  function handleMouseMove(e) {
    if (!isRecording || isPaused) return;

    const target = e.target;
    if (!target || target === hostEl || hostEl?.contains(target)) return;

    hoveredElement = target;
    const rect = target.getBoundingClientRect();

    if (highlightBox && tagBadge) {
      highlightBox.style.display = 'block';
      highlightBox.style.top = `${rect.top}px`;
      highlightBox.style.left = `${rect.left}px`;
      highlightBox.style.width = `${rect.width}px`;
      highlightBox.style.height = `${rect.height}px`;

      const idText = target.id ? `#${target.id}` : '';
      const classText = typeof target.className === 'string' && target.className.trim()
        ? `.${target.className.trim().split(/\s+/)[0]}`
        : '';
      const tag = target.tagName.toLowerCase();
      tagBadge.textContent = `${tag}${idText}${classText} — Click to capture`;
    }
  }

  // Click on host element to add step
  function handleClick(e) {
    if (!isRecording || isPaused) return;

    const target = e.target;
    if (!target || target === hostEl || hostEl?.contains(target)) return;

    e.preventDefault();
    e.stopPropagation();

    const selector = selectorFor(target);
    const rawText = (target.getAttribute('aria-label') || target.getAttribute('title') || target.innerText || target.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const rect = target.getBoundingClientRect();

    promptStepDetails({
      selector,
      rawText,
      path: window.location.pathname,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      tagName: target.tagName.toLowerCase(),
    });
  }

  // Quick edit modal right on the page
  function promptStepDetails(stepData) {
    if (!modalContainer) return;

    const defaultTitle = stepData.rawText || `Step ${steps.length + 1}`;

    modalContainer.innerHTML = `
      <div class="fp-modal-overlay">
        <div class="fp-modal">
          <div class="fp-modal-header">
            <h3 class="fp-modal-title">✨ Add Tour Step #${steps.length + 1}</h3>
          </div>
          <div class="fp-field">
            <label class="fp-label">Step Headline</label>
            <input class="fp-input" id="fp-modal-input-title" value="${defaultTitle.replace(/"/g, '&quot;')}" autofocus />
          </div>
          <div class="fp-field">
            <label class="fp-label">Description / Instructions</label>
            <textarea class="fp-textarea" id="fp-modal-input-desc" placeholder="Explain what this element does or what action to take..."></textarea>
          </div>
          <div class="fp-field">
            <label class="fp-label">Target Selector</label>
            <div class="fp-selector-preview">${stepData.selector}</div>
          </div>
          <div class="fp-modal-actions">
            <button class="fp-btn" id="fp-modal-cancel">Cancel</button>
            <button class="fp-btn primary" id="fp-modal-save">Add to Tour</button>
          </div>
        </div>
      </div>
    `;

    const titleInput = shadowRoot.getElementById('fp-modal-input-title');
    const descInput = shadowRoot.getElementById('fp-modal-input-desc');

    titleInput?.focus();
    titleInput?.select();

    const save = () => {
      const step = {
        selector: stepData.selector,
        text: titleInput?.value.trim() || defaultTitle,
        title: titleInput?.value.trim() || defaultTitle,
        description: descInput?.value.trim() || 'Tell people what this does.',
        path: stepData.path,
        rect: stepData.rect,
      };

      steps.push(step);
      saveSteps();
      closeModal();
      renderToolbar();
      notifyState();
    };

    const closeModal = () => {
      modalContainer.innerHTML = '';
    };

    shadowRoot.getElementById('fp-modal-save')?.addEventListener('click', save);
    shadowRoot.getElementById('fp-modal-cancel')?.addEventListener('click', closeModal);

    titleInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
      if (e.key === 'Escape') closeModal();
    });
  }

  // Keyboard controls
  function handleKeyDown(e) {
    if (!isRecording) return;
    if (e.key === 'Escape') {
      if (modalContainer && modalContainer.children.length > 0) {
        modalContainer.innerHTML = '';
      } else {
        isPaused = !isPaused;
        if (highlightBox) highlightBox.style.display = 'none';
        renderToolbar();
        notifyState();
      }
    }
  }

  // Send state update to background
  function notifyState() {
    chrome.runtime.sendMessage({
      type: 'FP_STATE_UPDATED',
      payload: {
        isRecording,
        isPaused,
        stepCount: steps.length,
        steps,
        url: window.location.href,
        pathname: window.location.pathname,
      },
    }).catch(() => undefined);
  }

  // Save steps to chrome.storage.local
  function saveSteps() {
    chrome.storage.local.set({
      flowpilot_recorded_steps: steps,
      flowpilot_last_site: window.location.href,
    });
  }

  // Export steps and open FlowPilot studio
  function exportToFlowPilot() {
    if (steps.length === 0) {
      alert('Please click at least one element to add a tour step before saving.');
      return;
    }

    chrome.storage.local.get(['flowpilot_dashboard_url'], (res) => {
      const dashboardBase = res.flowpilot_dashboard_url || 'https://dreambuilder-two.vercel.app';
      const cleanBase = dashboardBase.replace(/\/+$/, '');

      const payload = {
        type: 'tour',
        title: `${document.title || 'App'} Onboarding Tour`,
        builderUrl: window.location.href,
        steps: steps.map((s) => ({
          selector: s.selector,
          title: s.title || s.text || 'Step',
          text: s.text || s.title || 'Step',
          description: s.description || '',
          path: s.path || window.location.pathname,
        })),
        createdAt: new Date().toISOString(),
      };

      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const targetUrl = `${cleanBase}/create?type=tour#fp-extension-import=${encoded}`;

      // Open dashboard in new tab
      window.open(targetUrl, '_blank');

      // Stop recording here
      stopRecording();
    });
  }

  // Start recording
  function startRecording(initialSteps = []) {
    ensureShadowRoot();
    isRecording = true;
    isPaused = false;
    steps = initialSteps.length > 0 ? initialSteps : steps;

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    if (hostEl) hostEl.style.display = 'block';
    renderToolbar();
    notifyState();
  }

  // Stop recording
  function stopRecording() {
    isRecording = false;
    isPaused = false;

    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);

    if (highlightBox) highlightBox.style.display = 'none';
    if (hostEl) hostEl.style.display = 'none';
    notifyState();
  }

  // Listen for messages from background / popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'START_RECORDING':
        startRecording(message.steps || []);
        sendResponse({ success: true, count: steps.length });
        break;

      case 'STOP_RECORDING':
        stopRecording();
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
              tagBadge.textContent = `Preview: ${message.selector}`;
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
  chrome.storage.local.get(['flowpilot_recording_active', 'flowpilot_recorded_steps'], (res) => {
    if (res.flowpilot_recording_active) {
      startRecording(res.flowpilot_recorded_steps || []);
    }
  });
})();
