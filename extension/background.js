// FlowPilot Tour Builder - Background Service Worker (Manifest V3)

const DEFAULT_DASHBOARD_URL = 'https://dreambuilder-two.vercel.app';

// Initialize defaults on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['flowpilot_dashboard_url'], (res) => {
    if (!res.flowpilot_dashboard_url) {
      chrome.storage.local.set({
        flowpilot_dashboard_url: DEFAULT_DASHBOARD_URL,
        flowpilot_recording_active: false,
        flowpilot_recorded_steps: [],
      });
    }
  });
  console.log('[FlowPilot] Extension installed successfully.');
});

// Update badge count
function updateBadge(count, isRecording) {
  if (!isRecording) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }
  const text = count > 0 ? String(count) : 'REC';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
}

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'FP_STATE_UPDATED': {
      const { stepCount, isRecording, steps } = message.payload;
      updateBadge(stepCount, isRecording);
      chrome.storage.local.set({
        flowpilot_recording_active: isRecording,
        flowpilot_recorded_steps: steps,
      });
      sendResponse({ ok: true });
      break;
    }

    case 'START_RECORDING': {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) return sendResponse({ ok: false, error: 'No active tab' });
        const tabId = tabs[0].id;

        chrome.storage.local.get(['flowpilot_recorded_steps'], (res) => {
          const existingSteps = res.flowpilot_recorded_steps || [];

          chrome.tabs.sendMessage(tabId, { type: 'START_RECORDING', steps: existingSteps }, (response) => {
            if (chrome.runtime.lastError) {
              // Inject content script manually if needed
              chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js'],
              }, () => {
                setTimeout(() => {
                  chrome.tabs.sendMessage(tabId, { type: 'START_RECORDING', steps: existingSteps });
                }, 200);
              });
            }
            chrome.storage.local.set({ flowpilot_recording_active: true });
            updateBadge(existingSteps.length, true);
            sendResponse({ ok: true });
          });
        });
      });
      return true; // Keep sendResponse open
    }

    case 'STOP_RECORDING': {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'STOP_RECORDING' }, () => {
            // Ignore if tab closed
          });
        }
        chrome.storage.local.set({ flowpilot_recording_active: false });
        updateBadge(0, false);
        sendResponse({ ok: true });
      });
      return true;
    }

    case 'EXPORT_TO_FLOWPILOT': {
      chrome.storage.local.get(['flowpilot_dashboard_url', 'flowpilot_recorded_steps', 'flowpilot_last_site'], (res) => {
        const dashboard = (res.flowpilot_dashboard_url || DEFAULT_DASHBOARD_URL).replace(/\/+$/, '');
        const steps = res.flowpilot_recorded_steps || [];
        const lastSite = res.flowpilot_last_site || '';

        if (steps.length === 0) {
          return sendResponse({ ok: false, error: 'No steps recorded' });
        }

        const payload = {
          type: 'tour',
          title: 'Imported Web Tour',
          builderUrl: lastSite,
          steps: steps.map((s) => ({
            selector: s.selector,
            title: s.title || s.text || 'Step',
            text: s.text || s.title || 'Step',
            description: s.description || '',
            path: s.path || '',
          })),
          createdAt: new Date().toISOString(),
        };

        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
        const url = `${dashboard}/create?type=tour#fp-extension-import=${encoded}`;

        chrome.tabs.create({ url });
        sendResponse({ ok: true, url });
      });
      return true;
    }
  }
});
