import React, { useState } from 'react';
import { MODULES } from '../../core/modules';
import { ProjectRecord } from '../../data/services';
import { publicSitePath } from '../routes';
import { CopyBlock } from './InstallGuide';

const PLATFORMS = [
  {
    id: 'react-native',
    label: 'React Native',
    steps: ['Install the web view package: npx expo install react-native-webview (or npm install react-native-webview).', 'Show it on the screen where this should appear.'],
    code: (url: string) => `import { WebView } from 'react-native-webview';

export function FlowPilotScreen() {
  return <WebView source={{ uri: '${url}' }} style={{ flex: 1 }} />;
}`,
  },
  {
    id: 'flutter',
    label: 'Flutter',
    steps: ['Add webview_flutter to pubspec.yaml.', 'Show it on the screen where this should appear.'],
    code: (url: string) => `final controller = WebViewController()
  ..setJavaScriptMode(JavaScriptMode.unrestricted)
  ..loadRequest(Uri.parse('${url}'));

// In your build method:
WebViewWidget(controller: controller)`,
  },
  {
    id: 'android',
    label: 'Android',
    steps: ['Add a WebView to your layout, and allow internet access in AndroidManifest.xml.', 'Load the address in your activity or fragment.'],
    code: (url: string) => `webView.settings.javaScriptEnabled = true
webView.settings.domStorageEnabled = true
webView.loadUrl("${url}")`,
  },
  {
    id: 'ios',
    label: 'iPhone (Swift)',
    steps: ['Add a WKWebView to your screen.', 'Load the address.'],
    code: (url: string) => `import WebKit

let webView = WKWebView(frame: view.bounds)
view.addSubview(webView)
webView.load(URLRequest(url: URL(string: "${url}")!))`,
  },
];

/**
 * Apps show hosted pages in a web view. That works for anything that has its own page, and
 * the script works in any app built from web pages, such as Capacitor or Ionic.
 */
export const MobileSteps: React.FC<{ project: ProjectRecord }> = ({ project }) => {
  const [platformId, setPlatformId] = useState(PLATFORMS[0].id);
  const platform = PLATFORMS.find((item) => item.id === platformId)!;
  const url = project.status === 'published' && project.slug ? `${window.location.origin}${publicSitePath(project.slug)}` : null;
  const floats = MODULES[project.type].delivery === 'overlay';

  return (
    <div className="space-y-3">
      <p><strong className="font-semibold">Is your app made from web pages,</strong> such as with Capacitor, Ionic or Cordova, or does it show your website inside the app? Then add the script exactly as for a website, and it works there too.</p>
      {floats ? (
        <p><strong className="font-semibold">On native app screens,</strong> tours and banners can't float over them yet, because that needs a FlowPilot mobile SDK, which doesn't exist yet. They work wherever your app shows web pages.</p>
      ) : (
        <>
          <p><strong className="font-semibold">On a native app screen,</strong> show its page in a web view. Choose how your app is built:</p>
          <div role="tablist" aria-label="How your app is built" className="flex flex-wrap gap-1.5">
            {PLATFORMS.map((item) => (
              <button key={item.id} role="tab" type="button" aria-selected={item.id === platformId} onClick={() => setPlatformId(item.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${item.id === platformId ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}>
                {item.label}
              </button>
            ))}
          </div>
          <ol className="list-decimal pl-5 space-y-1">{platform.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          {url ? <CopyBlock label={`For ${platform.label}`} code={platform.code(url)} /> : <p role="note" className="rounded-lg px-3 py-2 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">Once it's published, the code appears here with its web address.</p>}
          <p className="text-[13px] text-slate-500 dark:text-slate-400">It updates by itself when you publish changes here, with no new app release.</p>
        </>
      )}
    </div>
  );
};
