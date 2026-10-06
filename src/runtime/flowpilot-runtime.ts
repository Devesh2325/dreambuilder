import { DocumentModel, ComponentNode } from '../types/document';
import { storage } from '../services/storage';

export interface RuntimeConfig {
  projectId: string;
  visitorId?: string;
  hostUrl?: string;
}

export class FlowPilotRuntime {
  private config: RuntimeConfig;
  private document: DocumentModel | null = null;
  private rootElement: HTMLElement | null = null;
  private currentStepIndex: number = 0;
  private isDismissed: boolean = false;

  constructor(config: RuntimeConfig) {
    this.config = {
      visitorId: `vis_${Math.random().toString(36).substring(2, 9)}`,
      ...config,
    };
  }

  async init(): Promise<void> {
    try {
      // 1. Fetch published project & document
      const project = storage.getProjectById(this.config.projectId);
      if (!project) {
        console.warn(`[FlowPilot] Project "${this.config.projectId}" not found or unpublished.`);
        return;
      }

      const doc = storage.getDocument(project.documentId);
      if (!doc || !doc.isPublished) {
        console.warn(`[FlowPilot] No published document available for project "${this.config.projectId}".`);
        return;
      }
      this.document = doc;

      // 2. Evaluate trigger conditions (URL matching, delays, frequency)
      if (!this.evaluateTriggers(doc)) {
        return;
      }

      // 3. Track impression event
      this.trackEvent('impression');

      // 4. Mount experience with configured delay
      const delayMs = (doc.triggerConditions.delaySeconds || 0) * 1000;
      setTimeout(() => {
        this.render();
      }, delayMs);
    } catch (err) {
      console.error('[FlowPilot Runtime Error]', err);
    }
  }

  private evaluateTriggers(doc: DocumentModel): boolean {
    const { urlRules = [], frequency = 'always' } = doc.triggerConditions;

    // Check frequency in localStorage
    const storageKey = `fp_exp_${this.config.projectId}`;
    if (frequency === 'once_per_visitor' && localStorage.getItem(storageKey)) {
      return false;
    }

    // Check URL rules
    if (urlRules.length > 0) {
      const currentPath = window.location.pathname;
      const matches = urlRules.some(rule => {
        if (rule.type === 'exact') return currentPath === rule.value;
        if (rule.type === 'contains') return currentPath.includes(rule.value);
        if (rule.type === 'starts_with') return currentPath.startsWith(rule.value);
        return true;
      });
      if (!matches) return false;
    }

    return true;
  }

  private render(): void {
    if (!this.document || this.isDismissed) return;

    // Create wrapper root element in DOM
    const existing = document.getElementById('flowpilot-experience-root');
    if (existing) existing.remove();

    this.rootElement = document.createElement('div');
    this.rootElement.id = 'flowpilot-experience-root';
    this.rootElement.style.cssText = `
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      pointer-events: auto;
    `;

    document.body.appendChild(this.rootElement);

    if (this.document.documentType === 'tour') {
      this.renderTourStep();
    } else if (this.document.documentType === 'banner') {
      this.renderBanner();
    } else if (this.document.documentType === 'popup') {
      this.renderPopup();
    } else {
      this.renderGeneric();
    }
  }

  private renderTourStep(): void {
    if (!this.document || !this.rootElement) return;

    const tourSteps = this.document.rootNode.children.filter(c => c.type === 'TourStep');
    if (tourSteps.length === 0) return;

    const currentStep = tourSteps[this.currentStepIndex];
    if (!currentStep) {
      this.dismiss('completed');
      return;
    }

    this.trackEvent('tour_step_viewed', { stepNumber: this.currentStepIndex + 1 });

    // Target selector resolution
    const selector = currentStep.target?.selector;
    let targetEl: HTMLElement | null = selector ? document.querySelector(selector) : null;

    let posX = window.innerWidth / 2 - 190;
    let posY = window.innerHeight / 2 - 120;

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const placement = currentStep.target?.placement || 'bottom';
      const offset = currentStep.target?.offset || 12;

      if (placement === 'bottom') {
        posX = rect.left;
        posY = rect.bottom + offset;
      } else if (placement === 'top') {
        posX = rect.left;
        posY = rect.top - 200 - offset;
      } else if (placement === 'right') {
        posX = rect.right + offset;
        posY = rect.top;
      } else if (placement === 'left') {
        posX = rect.left - 380 - offset;
        posY = rect.top;
      }
    } else if (selector) {
      // Graceful fallback when target is not found
      console.warn(`[FlowPilot] Tour target "${selector}" not found on page, centering step.`);
    }

    // Clamp coordinates within viewport
    posX = Math.max(16, Math.min(window.innerWidth - 400, posX));
    posY = Math.max(16, Math.min(window.innerHeight - 280, posY));

    this.rootElement.innerHTML = `
      <div style="
        position: fixed;
        left: ${posX}px;
        top: ${posY}px;
        width: 380px;
        background: #ffffff;
        color: #0f172a;
        border-radius: 12px;
        padding: 20px 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(226, 232, 240, 0.8);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 700; color: #6366f1; background: #eef2ff; padding: 2px 8px; rounded: 999px; text-transform: uppercase;">
            Step ${this.currentStepIndex + 1} of ${tourSteps.length}
          </span>
          <button id="fp-tour-close" style="background: none; border: none; font-size: 14px; color: #94a3b8; cursor: pointer;">✕</button>
        </div>
        <h4 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 700; color: #0f172a;">${currentStep.props.title || 'Step'}</h4>
        <p style="margin: 0 0 16px 0; font-size: 13px; color: #475569; line-height: 1.5;">${currentStep.props.description || ''}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          <button id="fp-tour-skip" style="background: none; border: none; font-size: 12px; color: #64748b; cursor: pointer;">Skip</button>
          <div style="display: flex; gap: 8px;">
            ${this.currentStepIndex > 0 ? `<button id="fp-tour-prev" style="padding: 6px 12px; font-size: 12px; background: #f1f5f9; border: none; border-radius: 6px; cursor: pointer;">Back</button>` : ''}
            <button id="fp-tour-next" style="padding: 6px 14px; font-size: 12px; font-weight: 600; color: #ffffff; background: #6366f1; border: none; border-radius: 6px; cursor: pointer;">
              ${this.currentStepIndex === tourSteps.length - 1 ? 'Finish 🎉' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind event handlers
    document.getElementById('fp-tour-close')?.addEventListener('click', () => this.dismiss('closed'));
    document.getElementById('fp-tour-skip')?.addEventListener('click', () => this.dismiss('skipped'));
    document.getElementById('fp-tour-prev')?.addEventListener('click', () => {
      this.currentStepIndex--;
      this.renderTourStep();
    });
    document.getElementById('fp-tour-next')?.addEventListener('click', () => {
      this.trackEvent('tour_step_completed', { stepNumber: this.currentStepIndex + 1 });
      if (this.currentStepIndex < tourSteps.length - 1) {
        this.currentStepIndex++;
        this.renderTourStep();
      } else {
        this.dismiss('completed');
      }
    });
  }

  private renderBanner(): void {
    if (!this.document || !this.rootElement) return;
    const bannerNode = this.document.rootNode.children.find(c => c.type === 'BannerWidget') || this.document.rootNode;
    const { badgeText = 'NEW', message = '', ctaText = 'Learn more', isDismissible = true } = bannerNode.props;

    this.rootElement.style.top = '0';
    this.rootElement.style.left = '0';
    this.rootElement.style.right = '0';

    this.rootElement.innerHTML = `
      <div style="
        background: #4338ca;
        color: #ffffff;
        padding: 10px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700;">${badgeText}</span>
          <span>${message}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          ${ctaText ? `<button id="fp-banner-cta" style="background: none; border: none; color: white; text-decoration: underline; font-weight: 600; cursor: pointer;">${ctaText}</button>` : ''}
          ${isDismissible ? `<button id="fp-banner-close" style="background: none; border: none; color: rgba(255,255,255,0.7); font-size: 14px; cursor: pointer;">✕</button>` : ''}
        </div>
      </div>
    `;

    document.getElementById('fp-banner-close')?.addEventListener('click', () => this.dismiss('banner_dismissed'));
    document.getElementById('fp-banner-cta')?.addEventListener('click', () => {
      this.trackEvent('cta_clicked');
    });
  }

  private renderPopup(): void {
    if (!this.document || !this.rootElement) return;
    const popupNode = this.document.rootNode.children.find(c => c.type === 'PopupWidget') || this.document.rootNode;
    const { headline = 'Special Offer', bodyText = '', ctaText = 'Get Started', cancelText = 'Close' } = popupNode.props;

    this.rootElement.style.inset = '0';
    this.rootElement.style.background = 'rgba(15, 23, 42, 0.6)';
    this.rootElement.style.display = 'flex';
    this.rootElement.style.alignItems = 'center';
    this.rootElement.style.justifyContent = 'center';

    this.rootElement.innerHTML = `
      <div style="
        background: #ffffff;
        border-radius: 16px;
        padding: 32px;
        width: 440px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      ">
        <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a;">${headline}</h3>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #475569; line-height: 1.5;">${bodyText}</p>
        <button id="fp-popup-cta" style="width: 100%; padding: 12px; background: #6366f1; color: white; font-weight: 700; font-size: 14px; border: none; border-radius: 10px; cursor: pointer; margin-bottom: 8px;">
          ${ctaText}
        </button>
        <button id="fp-popup-close" style="background: none; border: none; font-size: 12px; color: #94a3b8; cursor: pointer;">
          ${cancelText}
        </button>
      </div>
    `;

    document.getElementById('fp-popup-close')?.addEventListener('click', () => this.dismiss('popup_dismissed'));
    document.getElementById('fp-popup-cta')?.addEventListener('click', () => {
      this.trackEvent('cta_clicked');
      this.dismiss('cta_completed');
    });
  }

  private renderGeneric(): void {
    if (!this.document || !this.rootElement) return;
    // Renders custom widgets (e.g. Floating Checklist or Survey) in bottom right corner
    this.rootElement.style.bottom = '24px';
    this.rootElement.style.right = '24px';
    this.rootElement.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; width: 320px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 13px; color: #0f172a;">${this.document.title}</strong>
          <button id="fp-generic-close" style="border: none; background: none; color: #94a3b8; cursor: pointer;">✕</button>
        </div>
        <div style="font-size: 12px; color: #64748b;">FlowPilot experience active.</div>
      </div>
    `;
    document.getElementById('fp-generic-close')?.addEventListener('click', () => this.dismiss('closed'));
  }

  private dismiss(reason: string): void {
    this.isDismissed = true;
    if (this.rootElement) this.rootElement.remove();
    this.trackEvent(reason === 'completed' ? 'tour_completed' : 'banner_dismissed');

    // Mark as seen for frequency rules
    if (this.document?.triggerConditions.frequency === 'once_per_visitor') {
      localStorage.setItem(`fp_exp_${this.config.projectId}`, 'true');
    }
  }

  private trackEvent(eventType: any, metadata?: Record<string, any>): void {
    if (!this.document) return;
    storage.recordAnalyticsEvent({
      projectId: this.config.projectId,
      documentId: this.document.id,
      eventType,
      visitorId: this.config.visitorId || 'anon',
      sessionId: `sess_${Date.now()}`,
      deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
      url: window.location.href,
      metadata,
    });
  }
}

// Auto-initialize when loaded via script tag on client websites
if (typeof window !== 'undefined') {
  (window as any).FlowPilotRuntime = FlowPilotRuntime;

  // Check script tag for data-project-id
  const currentScript = document.currentScript as HTMLScriptElement;
  const projectId = currentScript?.getAttribute('data-project-id');
  if (projectId) {
    const runtime = new FlowPilotRuntime({ projectId });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => runtime.init());
    } else {
      runtime.init();
    }
  }
}
