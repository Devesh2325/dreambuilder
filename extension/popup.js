// FlowPilot Extension Popup Script
// Advanced Multi-Tour Manager, Live On-Page Player & Streamlined Visual Recorder

document.addEventListener('DOMContentLoaded', () => {
  // Elements - Header & Tabs
  const statusIndicator = document.getElementById('fp-status-indicator');
  const statusText = document.getElementById('fp-status-text');
  const tabBuild = document.getElementById('fp-tab-build');
  const tabTours = document.getElementById('fp-tab-tours');
  const tabSettings = document.getElementById('fp-tab-settings');
  const panelBuild = document.getElementById('fp-panel-build');
  const panelTours = document.getElementById('fp-panel-tours');
  const panelSettings = document.getElementById('fp-panel-settings');
  const savedToursCountBadge = document.getElementById('fp-saved-tours-count');

  // Elements - Build Tab
  const currentUrlEl = document.getElementById('fp-current-url');
  const siteDomainEl = document.getElementById('fp-site-domain');
  const tourNameInput = document.getElementById('fp-tour-name-input');
  const toggleRecordBtn = document.getElementById('fp-toggle-record');
  const recordIcon = document.getElementById('fp-record-icon');
  const recordBtnText = document.getElementById('fp-record-btn-text');
  const recordHint = document.getElementById('fp-record-hint');
  const recordingControls = document.getElementById('fp-recording-controls');
  const pauseRecordBtn = document.getElementById('fp-pause-record');
  const finishRecordBtn = document.getElementById('fp-finish-record');
  const stepsListEl = document.getElementById('fp-steps-list');
  const stepCountEl = document.getElementById('fp-step-count');
  const emptyStateEl = document.getElementById('fp-empty-state');
  const clearStepsBtn = document.getElementById('fp-clear-steps');
  const previewCapturedBtn = document.getElementById('fp-preview-captured-steps');
  const exportStudioBtn = document.getElementById('fp-export-studio');

  // Elements - Tours List Tab
  const toursListContainer = document.getElementById('fp-tours-list');
  const btnNewTourFromList = document.getElementById('fp-btn-new-tour-from-list');

  // Elements - Settings Tab
  const dashboardUrlInput = document.getElementById('fp-dashboard-url');
  const saveSettingsBtn = document.getElementById('fp-save-settings');
  const optSmartTarget = document.getElementById('fp-opt-smart-target');
  const optInlineEditor = document.getElementById('fp-opt-inline-editor');
  const optHighlightScrim = document.getElementById('fp-opt-highlight-scrim');

  let currentTab = null;
  let isRecording = false;
  let isPaused = false;
  let steps = [];
  let currentDomain = '';
  let savedTours = [];

  // ==========================================
  // 1. TAB NAVIGATION
  // ==========================================
  function switchTab(activeTabBtn, activePanel) {
    [tabBuild, tabTours, tabSettings].forEach((b) => b?.classList.remove('active'));
    [panelBuild, panelTours, panelSettings].forEach((p) => {
      if (p) p.style.display = 'none';
      p?.classList.remove('active');
    });

    activeTabBtn.classList.add('active');
    activePanel.style.display = 'block';
    activePanel.classList.add('active');

    if (activePanel === panelTours) {
      loadSavedTours();
    }
  }

  tabBuild?.addEventListener('click', () => switchTab(tabBuild, panelBuild));
  tabTours?.addEventListener('click', () => switchTab(tabTours, panelTours));
  tabSettings?.addEventListener('click', () => switchTab(tabSettings, panelSettings));
  btnNewTourFromList?.addEventListener('click', () => switchTab(tabBuild, panelBuild));

  // ==========================================
  // 2. INITIALIZATION & CURRENT TAB INSPECTION
  // ==========================================
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentTab = tabs[0];
    if (currentTab?.url) {
      try {
        const u = new URL(currentTab.url);
        currentDomain = u.hostname;
        if (siteDomainEl) siteDomainEl.textContent = currentDomain;
        currentUrlEl.textContent = `${u.hostname}${u.pathname}`;
        currentUrlEl.title = currentTab.url;

        // Sensible default tour name based on page
        const pageName = document.title ? document.title.split(/[-|]/)[0].trim() : u.pathname.replace(/^\//, '') || 'Platform';
        if (tourNameInput && (!tourNameInput.value || tourNameInput.value === 'App Onboarding Tour')) {
          tourNameInput.value = `${pageName.slice(0, 25)} Walkthrough`;
        }
      } catch {
        currentUrlEl.textContent = currentTab.url;
      }
    } else {
      currentUrlEl.textContent = 'Restricted page (e.g. chrome://)';
      toggleRecordBtn.disabled = true;
      recordHint.textContent = 'Cannot record on internal browser pages. Navigate to your web app.';
    }

    // Load active status from content script
    if (currentTab?.id) {
      chrome.tabs.sendMessage(currentTab.id, { type: 'GET_STATUS' }, (res) => {
        if (!chrome.runtime.lastError && res) {
          isRecording = Boolean(res.isRecording);
          isPaused = Boolean(res.isPaused);
          steps = res.steps || [];
          updateUI();
        } else {
          loadFromStorage();
        }
      });
    } else {
      loadFromStorage();
    }

    loadSavedTours();
  });

  function loadFromStorage() {
    chrome.storage.local.get([
      'flowpilot_recording_active',
      'flowpilot_recording_paused',
      'flowpilot_recorded_steps',
      'flowpilot_dashboard_url',
      'flowpilot_current_tour_title',
      'flowpilot_opt_smart_target',
      'flowpilot_opt_inline_editor',
      'flowpilot_opt_highlight_scrim',
    ], (res) => {
      isRecording = Boolean(res.flowpilot_recording_active);
      isPaused = Boolean(res.flowpilot_recording_paused);
      steps = res.flowpilot_recorded_steps || [];
      if (res.flowpilot_dashboard_url && dashboardUrlInput) {
        dashboardUrlInput.value = res.flowpilot_dashboard_url;
      }
      if (res.flowpilot_current_tour_title && tourNameInput) {
        tourNameInput.value = res.flowpilot_current_tour_title;
      }
      if (optSmartTarget) optSmartTarget.checked = res.flowpilot_opt_smart_target !== false;
      if (optInlineEditor) optInlineEditor.checked = res.flowpilot_opt_inline_editor !== false;
      if (optHighlightScrim) optHighlightScrim.checked = res.flowpilot_opt_highlight_scrim !== false;

      updateUI();
    });
  }

  // ==========================================
  // 3. UI STATE UPDATER
  // ==========================================
  function updateUI() {
    if (isRecording) {
      statusIndicator.classList.add('recording');
      statusText.textContent = isPaused ? 'Paused' : 'Recording';
      toggleRecordBtn.classList.add('recording');
      recordIcon.textContent = '⏹';
      recordBtnText.textContent = 'Stop Visual Recording';
      recordHint.textContent = 'Click on elements on your app. Tooltips attach directly to what you click!';
      if (recordingControls) recordingControls.style.display = 'block';
      if (pauseRecordBtn) {
        pauseRecordBtn.innerHTML = isPaused ? '<span>▶ Resume</span>' : '<span>⏸ Pause</span>';
      }
    } else {
      statusIndicator.classList.remove('recording');
      statusText.textContent = 'Ready';
      toggleRecordBtn.classList.remove('recording');
      recordIcon.textContent = '🎯';
      recordBtnText.textContent = 'Start Point-and-Click Recording';
      recordHint.textContent = 'Hover over buttons, inputs, or menus on your app. Click to attach an interactive tooltip instantly.';
      if (recordingControls) recordingControls.style.display = 'none';
    }

    // Step counter & action buttons
    stepCountEl.textContent = String(steps.length);
    if (clearStepsBtn) clearStepsBtn.style.display = steps.length > 0 ? 'inline-block' : 'none';
    if (previewCapturedBtn) previewCapturedBtn.style.display = steps.length > 0 ? 'inline-block' : 'none';
    if (exportStudioBtn) exportStudioBtn.disabled = steps.length === 0;

    renderSteps();
  }

  function renderSteps() {
    stepsListEl.innerHTML = '';

    if (steps.length === 0) {
      emptyStateEl.style.display = 'block';
      stepsListEl.appendChild(emptyStateEl);
      return;
    }

    emptyStateEl.style.display = 'none';

    steps.forEach((step, idx) => {
      const item = document.createElement('div');
      item.className = 'fp-step-item';

      const title = step.title || step.text || `Step ${idx + 1}`;
      const desc = step.description ? `<p class="fp-step-desc">${escapeHtml(step.description)}</p>` : '';
      const selectorText = step.selector ? `<span class="fp-step-selector">${escapeHtml(step.selector)}</span>` : '';
      const tagText = step.tagName ? `<span class="fp-step-tag">${escapeHtml(step.tagName)}</span>` : '';

      item.innerHTML = `
        <div class="fp-step-badge">${idx + 1}</div>
        <div class="fp-step-content">
          <div class="fp-step-title-row">
            <span class="fp-step-title">${escapeHtml(title)}</span>
            ${tagText}
          </div>
          ${desc}
          ${selectorText}
        </div>
        <div class="fp-step-actions">
          <button class="fp-btn-icon" data-action="locate" data-index="${idx}" title="Highlight on page">👁</button>
          <button class="fp-btn-icon danger" data-action="delete" data-index="${idx}" title="Delete step">✕</button>
        </div>
      `;

      item.querySelector('[data-action="locate"]')?.addEventListener('click', () => {
        if (currentTab?.id && step.selector) {
          chrome.tabs.sendMessage(currentTab.id, { type: 'HIGHLIGHT_STEP', selector: step.selector });
        }
      });

      item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        steps.splice(idx, 1);
        chrome.storage.local.set({ flowpilot_recorded_steps: steps }, () => {
          if (currentTab?.id) {
            chrome.tabs.sendMessage(currentTab.id, { type: 'START_RECORDING', steps });
          }
          updateUI();
        });
      });

      stepsListEl.appendChild(item);
    });
  }

  // ==========================================
  // 4. RECORDING CONTROLS
  // ==========================================
  toggleRecordBtn?.addEventListener('click', () => {
    if (!currentTab?.id) return;

    if (!isRecording) {
      const tourTitle = tourNameInput?.value.trim() || 'App Onboarding Tour';
      chrome.storage.local.set({ flowpilot_current_tour_title: tourTitle });

      chrome.runtime.sendMessage({
        type: 'START_RECORDING',
        tourTitle,
        options: {
          smartTarget: optSmartTarget?.checked !== false,
          inlineEditor: optInlineEditor?.checked !== false,
          highlightScrim: optHighlightScrim?.checked !== false,
        },
      }, (res) => {
        if (res?.ok) {
          isRecording = true;
          isPaused = false;
          updateUI();
          window.close(); // Close popup so user can click immediately on their site
        }
      });
    } else {
      chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }, () => {
        isRecording = false;
        isPaused = false;
        updateUI();
      });
    }
  });

  pauseRecordBtn?.addEventListener('click', () => {
    if (!currentTab?.id) return;
    chrome.tabs.sendMessage(currentTab.id, { type: 'TOGGLE_PAUSE' }, (res) => {
      isPaused = Boolean(res?.isPaused);
      updateUI();
    });
  });

  finishRecordBtn?.addEventListener('click', () => {
    saveTourLocally();
    chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }, () => {
      isRecording = false;
      isPaused = false;
      updateUI();
      switchTab(tabTours, panelTours);
    });
  });

  clearStepsBtn?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all captured tour steps?')) {
      steps = [];
      chrome.storage.local.set({ flowpilot_recorded_steps: [] }, () => {
        if (currentTab?.id) {
          chrome.tabs.sendMessage(currentTab.id, { type: 'CLEAR_STEPS' });
        }
        updateUI();
      });
    }
  });

  // Preview captured steps right on page
  previewCapturedBtn?.addEventListener('click', () => {
    if (steps.length === 0 || !currentTab?.id) return;

    const tourToPlay = {
      title: tourNameInput?.value.trim() || 'Current Tour Preview',
      steps,
      builderUrl: currentTab.url,
    };

    chrome.tabs.sendMessage(currentTab.id, { type: 'PLAY_TOUR', tour: tourToPlay }, () => {
      window.close(); // Close popup so user can experience the tour
    });
  });

  // ==========================================
  // 5. SAVED TOURS & ON-PAGE LIVE RUNNER
  // ==========================================
  function saveTourLocally() {
    if (steps.length === 0) return;

    const tourTitle = tourNameInput?.value.trim() || `${currentDomain || 'App'} Tour`;
    const newTour = {
      id: `tour_${Date.now()}`,
      title: tourTitle,
      domain: currentDomain,
      builderUrl: currentTab?.url || '',
      steps: [...steps],
      createdAt: new Date().toISOString(),
    };

    chrome.storage.local.get(['flowpilot_workspace_tours'], (res) => {
      const existing = res.flowpilot_workspace_tours || [];
      // Replace if same title and domain, otherwise prepend
      const filtered = existing.filter((t) => !(t.title === tourTitle && t.domain === currentDomain));
      const updated = [newTour, ...filtered];

      chrome.storage.local.set({ flowpilot_workspace_tours: updated }, () => {
        savedTours = updated;
        renderSavedTours();
      });
    });
  }

  function loadSavedTours() {
    chrome.storage.local.get(['flowpilot_workspace_tours'], (res) => {
      savedTours = res.flowpilot_workspace_tours || [];
      if (savedToursCountBadge) {
        savedToursCountBadge.textContent = String(savedTours.length);
      }
      renderSavedTours();
    });
  }

  function renderSavedTours() {
    if (!toursListContainer) return;
    toursListContainer.innerHTML = '';

    if (savedTours.length === 0) {
      toursListContainer.innerHTML = `
        <div class="fp-empty-state">
          <div class="fp-empty-icon">✨</div>
          <p class="fp-empty-text">No saved tours yet.</p>
          <p class="fp-empty-subtext">Click "Create Tour" to record an onboarding walkthrough directly on your app!</p>
        </div>
      `;
      return;
    }

    // Group or match current domain
    savedTours.forEach((tour) => {
      const isCurrentDomain = !tour.domain || !currentDomain || tour.domain === currentDomain;
      const card = document.createElement('div');
      card.className = `fp-tour-card ${isCurrentDomain ? 'match-domain' : ''}`;

      const dateStr = tour.createdAt ? new Date(tour.createdAt).toLocaleDateString() : '';
      const stepCount = tour.steps?.length ?? 0;

      card.innerHTML = `
        <div class="fp-tour-card-header">
          <div>
            <h3 class="fp-tour-card-title">${escapeHtml(tour.title)}</h3>
            <div class="fp-tour-card-meta">
              <span class="fp-pill-step-count">${stepCount} step${stepCount === 1 ? '' : 's'}</span>
              <span class="fp-tour-domain-tag">${escapeHtml(tour.domain || 'Any site')}</span>
              <span class="fp-tour-date">${dateStr}</span>
            </div>
          </div>
          <button class="fp-btn-delete-tour" data-id="${tour.id}" title="Remove tour">✕</button>
        </div>

        <div class="fp-tour-card-actions">
          <button class="fp-btn-play-live" data-id="${tour.id}">
            <span>▶ Play Live on Page</span>
          </button>
          <button class="fp-btn-studio-edit" data-id="${tour.id}">
            <span>✏️ Edit in FlowPilot</span>
          </button>
        </div>
      `;

      // Play Live on this tab
      card.querySelector('.fp-btn-play-live')?.addEventListener('click', () => {
        if (!currentTab?.id) return;
        chrome.tabs.sendMessage(currentTab.id, { type: 'PLAY_TOUR', tour }, (res) => {
          if (chrome.runtime.lastError) {
            // Script might need injection
            chrome.scripting.executeScript({
              target: { tabId: currentTab.id },
              files: ['content.js'],
            }, () => {
              setTimeout(() => {
                chrome.tabs.sendMessage(currentTab.id, { type: 'PLAY_TOUR', tour });
              }, 200);
            });
          }
          window.close(); // Close popup so user sees the live tour on their site
        });
      });

      // Edit in FlowPilot Studio
      card.querySelector('.fp-btn-studio-edit')?.addEventListener('click', () => {
        openTourInStudio(tour);
      });

      // Delete tour
      card.querySelector('.fp-btn-delete-tour')?.addEventListener('click', () => {
        if (confirm(`Delete "${tour.title}"?`)) {
          savedTours = savedTours.filter((t) => t.id !== tour.id);
          chrome.storage.local.set({ flowpilot_workspace_tours: savedTours }, () => {
            renderSavedTours();
            if (savedToursCountBadge) savedToursCountBadge.textContent = String(savedTours.length);
          });
        }
      });

      toursListContainer.appendChild(card);
    });
  }

  function openTourInStudio(tour) {
    chrome.storage.local.get(['flowpilot_dashboard_url'], (res) => {
      const dashboard = (res.flowpilot_dashboard_url || 'https://dreambuilder-two.vercel.app').replace(/\/+$/, '');
      const payload = {
        type: 'tour',
        title: tour.title,
        builderUrl: tour.builderUrl || currentTab?.url || '',
        steps: (tour.steps || []).map((s) => ({
          selector: s.selector,
          title: s.title || s.text || 'Step',
          text: s.text || s.title || 'Step',
          description: s.description || '',
          path: s.path || '',
        })),
        createdAt: tour.createdAt || new Date().toISOString(),
      };

      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const url = `${dashboard}/create?type=tour#fp-extension-import=${encoded}`;
      chrome.tabs.create({ url });
    });
  }

  // ==========================================
  // 6. EXPORT DIRECTLY TO STUDIO
  // ==========================================
  exportStudioBtn?.addEventListener('click', () => {
    if (steps.length === 0) return;

    saveTourLocally();

    const tourTitle = tourNameInput?.value.trim() || 'Imported Web Tour';
    const activeTour = {
      title: tourTitle,
      builderUrl: currentTab?.url || '',
      steps,
      createdAt: new Date().toISOString(),
    };

    openTourInStudio(activeTour);
    window.close();
  });

  // ==========================================
  // 7. SETTINGS & SYNC
  // ==========================================
  saveSettingsBtn?.addEventListener('click', () => {
    const raw = dashboardUrlInput?.value.trim();
    if (!raw) return;

    let target = raw;
    if (!/^https?:\/\//i.test(target)) {
      target = target.includes('localhost') ? `http://${target}` : `https://${target}`;
    }

    chrome.storage.local.set({
      flowpilot_dashboard_url: target,
      flowpilot_opt_smart_target: optSmartTarget?.checked !== false,
      flowpilot_opt_inline_editor: optInlineEditor?.checked !== false,
      flowpilot_opt_highlight_scrim: optHighlightScrim?.checked !== false,
    }, () => {
      dashboardUrlInput.value = target;
      saveSettingsBtn.textContent = 'Saved!';
      setTimeout(() => {
        saveSettingsBtn.textContent = 'Save';
      }, 1500);
    });
  });

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
