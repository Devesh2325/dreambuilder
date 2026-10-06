/**
 * FlowPilot Client Runtime v2.0
 * Lightweight (<15kb), zero-dependency client embed script for published experiences.
 */
(function() {
  function initFlowPilot() {
    var script = document.currentScript || document.querySelector('script[data-project-id]');
    if (!script) return;
    var projectId = script.getAttribute('data-project-id');
    if (!projectId) return;

    console.log('[FlowPilot] Initializing published experience for project:', projectId);

    // Read stored experience configurations from localStorage or API
    try {
      var rawProjects = localStorage.getItem('flowpilot_projects');
      var rawDocs = localStorage.getItem('flowpilot_documents');
      if (!rawProjects || !rawDocs) return;

      var projects = JSON.parse(rawProjects);
      var docs = JSON.parse(rawDocs);

      var project = projects.find(function(p) { return p.id === projectId; });
      if (!project || project.status !== 'published') return;

      var doc = docs[project.documentId];
      if (!doc) return;

      // Mount experience overlay container
      var root = document.createElement('div');
      root.id = 'flowpilot-embed-root';
      root.style.cssText = 'position:fixed;z-index:999999;font-family:system-ui,-apple-system,sans-serif;pointer-events:auto;';
      document.body.appendChild(root);

      // Render based on type
      if (doc.documentType === 'banner') {
        var bannerNode = doc.rootNode.children[0] || doc.rootNode;
        var p = bannerNode.props || {};
        root.style.top = '0';
        root.style.left = '0';
        root.style.right = '0';
        root.innerHTML = '<div style="background:#4338ca;color:#fff;padding:10px 20px;display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:500;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">' +
          '<div><span style="background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;margin-right:8px;">' + (p.badgeText || 'NEW') + '</span>' +
          '<span>' + (p.message || '') + '</span></div>' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
          (p.ctaText ? '<a href="' + (p.ctaUrl || '#') + '" style="color:#fff;text-decoration:underline;font-weight:600;">' + p.ctaText + '</a>' : '') +
          '<button id="fp-close" style="background:none;border:none;color:#fff;font-size:14px;cursor:pointer;">✕</button></div></div>';
        document.getElementById('fp-close').onclick = function() { root.remove(); };
      } else if (doc.documentType === 'popup') {
        var popupNode = doc.rootNode.children[0] || doc.rootNode;
        var pp = popupNode.props || {};
        root.style.inset = '0';
        root.style.background = 'rgba(15,23,42,0.6)';
        root.style.display = 'flex';
        root.style.alignItems = 'center';
        root.style.justifyContent = 'center';
        root.innerHTML = '<div style="background:#fff;border-radius:16px;padding:32px;width:420px;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">' +
          '<h3 style="margin:0 0 8px 0;font-size:20px;font-weight:700;color:#0f172a;">' + (pp.headline || 'Special Announcement') + '</h3>' +
          '<p style="margin:0 0 20px 0;font-size:14px;color:#475569;line-height:1.5;">' + (pp.bodyText || '') + '</p>' +
          '<button id="fp-popup-btn" style="width:100%;padding:12px;background:#6366f1;color:#fff;font-weight:700;font-size:14px;border:none;border-radius:10px;cursor:pointer;">' + (pp.ctaText || 'Get Started') + '</button>' +
          '<button id="fp-popup-close" style="margin-top:10px;background:none;border:none;font-size:12px;color:#94a3b8;cursor:pointer;">' + (pp.cancelText || 'Dismiss') + '</button>' +
          '</div>';
        document.getElementById('fp-popup-close').onclick = function() { root.remove(); };
        document.getElementById('fp-popup-btn').onclick = function() { root.remove(); };
      }
    } catch (e) {
      console.warn('[FlowPilot] Runtime load warning:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFlowPilot);
  } else {
    initFlowPilot();
  }
})();
