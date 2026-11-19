// FlowPilot Extension Popup Script

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const statusIndicator = document.getElementById('fp-status-indicator');
  const statusText = document.getElementById('fp-status-text');
  const currentUrlEl = document.getElementById('fp-current-url');
  const toggleRecordBtn = document.getElementById('fp-toggle-record');
  const recordIcon = document.getElementById('fp-record-icon');
  const recordBtnText = document.getElementById('fp-record-btn-text');
  const recordHint = document.getElementById('fp-record-hint');
  const stepsListEl = document.getElementById('fp-steps-list');
  const stepCountEl = document.getElementById('fp-step-count');
  const emptyStateEl = document.getElementById('fp-empty-state');
  const clearStepsBtn = document.getElementById('fp-clear-steps');
  const exportStudioBtn = document.getElementById('fp-export-studio');
  const dashboardUrlInput = document.getElementById('fp-dashboard-url');
  const saveSettingsBtn = document.getElementById('fp-save-settings');

  let currentTab = null;
  let isRecording = false;
  let steps = [];

  // 1. Load active tab and settings
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentTab = tabs[0];
    if (currentTab?.url) {
      try {
        const u = new URL(currentTab.url);
        currentUrlEl.textContent = `${u.hostname}${u.pathname}`;
        currentUrlEl.title = currentTab.url;
      } catch {
        currentUrlEl.textContent = currentTab.url;
      }
    } else {
      currentUrlEl.textContent = 'Restricted page (e.g. chrome://)';
      toggleRecordBtn.disabled = true;
      recordHint.textContent = 'Cannot record on browser internal pages. Navigate to a web app.';
    }

    // Check status from content script if available
    if (currentTab?.id) {
      chrome.tabs.sendMessage(currentTab.id, { type: 'GET_STATUS' }, (res) => {
        if (!chrome.runtime.lastError && res) {
          isRecording = res.isRecording;
          steps = res.steps || [];
          updateUI();
        } else {
          // Fallback to storage
          loadFromStorage();
        }
      });
    } else {
      loadFromStorage();
    }
  });

  function loadFromStorage() {
    chrome.storage.local.get([
      'flowpilot_recording_active',
      'flowpilot_recorded_steps',
      'flowpilot_dashboard_url',
    ], (res) => {
      isRecording = Boolean(res.flowpilot_recording_active);
      steps = res.flowpilot_recorded_steps || [];
      if (res.flowpilot_dashboard_url) {
        dashboardUrlInput.value = res.flowpilot_dashboard_url;
      }
      updateUI();
    });
  }

  // 2. Update UI based on state
  function updateUI() {
    // Status indicator
    if (isRecording) {
      statusIndicator.classList.add('recording');
      statusText.textContent = 'Recording Active';
      toggleRecordBtn.classList.add('recording');
      recordIcon.textContent = '⏹';
      recordBtnText.textContent = 'Stop Recording';
      recordHint.textContent = 'Click on elements on your site. Switch to Navigate mode to browse.';
    } else {
      statusIndicator.classList.remove('recording');
      statusText.textContent = 'Ready';
      toggleRecordBtn.classList.remove('recording');
      recordIcon.textContent = '🎯';
      recordBtnText.textContent = 'Start Visual Recording';
      recordHint.textContent = 'Click to launch the visual element picker on this page';
    }

    // Step counter
    stepCountEl.textContent = String(steps.length);
    clearStepsBtn.style.display = steps.length > 0 ? 'inline-block' : 'none';
    exportStudioBtn.disabled = steps.length === 0;

    // Steps list
    renderSteps();
  }

  // 3. Render steps list
  function renderSteps() {
    if (steps.length === 0) {
      stepsListEl.innerHTML = '';
      stepsListEl.appendChild(emptyStateEl);
      emptyStateEl.style.display = 'block';
      return;
    }

    emptyStateEl.style.display = 'none';
    stepsListEl.innerHTML = '';

    steps.forEach((step, index) => {
      const item = document.createElement('div');
      item.className = 'fp-step-item';

      const title = step.title || step.text || `Step ${index + 1}`;
      const selector = step.selector || '';

      item.innerHTML = `
        <div class="fp-step-num">${index + 1}</div>
        <div class="fp-step-info">
          <div class="fp-step-text" title="${title}">${title}</div>
          <div class="fp-step-selector" title="${selector}">${selector}</div>
        </div>
        <div class="fp-step-actions">
          <button class="fp-btn-step-action highlight" title="Highlight on page">👁️</button>
          <button class="fp-btn-step-action delete" title="Remove step">✕</button>
        </div>
      `;

      // Highlight button
      item.querySelector('.highlight')?.addEventListener('click', () => {
        if (currentTab?.id) {
          chrome.tabs.sendMessage(currentTab.id, {
            type: 'HIGHLIGHT_STEP',
            selector: step.selector,
          });
        }
      });

      // Delete button
      item.querySelector('.delete')?.addEventListener('click', () => {
        steps.splice(index, 1);
        chrome.storage.local.set({ flowpilot_recorded_steps: steps }, () => {
          updateUI();
          if (currentTab?.id) {
            chrome.tabs.sendMessage(currentTab.id, {
              type: 'START_RECORDING',
              steps,
            });
          }
        });
      });

      stepsListEl.appendChild(item);
    });
  }

  // 4. Toggle Recording
  toggleRecordBtn.addEventListener('click', () => {
    if (toggleRecordBtn.disabled) return;

    if (!isRecording) {
      // Start recording
      chrome.runtime.sendMessage({ type: 'START_RECORDING' }, (res) => {
        if (res?.ok) {
          isRecording = true;
          updateUI();
          window.close(); // Close popup so user can click immediately on their site
        }
      });
    } else {
      // Stop recording
      chrome.runtime.sendMessage({ type: 'STOP_RECORDING' }, () => {
        isRecording = false;
        updateUI();
      });
    }
  });

  // 5. Clear all steps
  clearStepsBtn.addEventListener('click', () => {
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

  // 6. Export to FlowPilot Studio
  exportStudioBtn.addEventListener('click', () => {
    if (steps.length === 0) return;

    exportStudioBtn.disabled = true;
    exportStudioBtn.textContent = 'Opening FlowPilot Studio...';

    chrome.runtime.sendMessage({ type: 'EXPORT_TO_FLOWPILOT' }, (res) => {
      exportStudioBtn.disabled = false;
      exportStudioBtn.innerHTML = '<span>🚀 Open & Save in FlowPilot</span>';
      if (res?.ok) {
        window.close();
      }
    });
  });

  // 7. Save settings
  saveSettingsBtn.addEventListener('click', () => {
    const raw = dashboardUrlInput.value.trim();
    if (!raw) return;

    let target = raw;
    if (!/^https?:\/\//i.test(target)) {
      target = target.includes('localhost') ? `http://${target}` : `https://${target}`;
    }

    chrome.storage.local.set({ flowpilot_dashboard_url: target }, () => {
      dashboardUrlInput.value = target;
      saveSettingsBtn.textContent = 'Saved!';
      setTimeout(() => {
        saveSettingsBtn.textContent = 'Save';
      }, 1500);
    });
  });
});
