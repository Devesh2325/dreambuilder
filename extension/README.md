# FlowPilot Tour Builder - Chrome Extension

Visual tour and walkthrough builder for any web application. Similar to Userpilot and Whatfix, it allows you to build product tours directly on your live website or web app without writing code or editing templates manually.

---

## 🚀 Features

- **Direct In-App Creation**: Open any website (production or localhost) and click on buttons, menus, inputs, or headers to turn them into interactive tour steps.
- **Zero Embed Script Required During Authoring**: Build and test tours before adding any code to your website.
- **Shadow DOM Isolation**: The visual recorder overlay runs inside an isolated Shadow DOM container, meaning your site's styles never break the builder, and the builder never affects your app.
- **Navigate vs. Pick Mode**: Easily switch between **Pick Elements** and **Navigate App** mode to open dropdowns, jump across pages, or trigger modals before selecting targets.
- **One-Click Studio Export**: Click **Save & Open Studio** to automatically import all recorded steps directly into the FlowPilot studio editor.
- **Auto Selector Intelligence**: Detects robust, resilient CSS selectors prioritizing `data-testid`, `data-tour`, `aria-label`, and `id`.

---

## 📦 How to Install in Chrome

1. Open Google Chrome.
2. Go to `chrome://extensions` in the address bar.
3. Turn on **Developer mode** using the toggle switch in the top right corner.
4. Click **Load unpacked** in the top left.
5. Select this folder: `d:\Builder\extension` (or the folder where this extension was extracted).
6. The **FlowPilot Tour Builder** icon will now appear in your Chrome toolbar. Pin it for quick access!

---

## 🎯 How to Use

1. Navigate to the web application you want to create a tour for (e.g. `https://your-app.com` or `http://localhost:3000`).
2. Click the **FlowPilot** extension icon in your browser toolbar.
3. Click **Start Visual Recording**. A floating toolbar will appear at the bottom of your screen.
4. Hover over any button, input, or element — you will see an indigo spotlight outline.
5. **Click** the element to capture it as a step. You can enter a headline and instructions right on your screen.
6. To click links or navigate without capturing, switch to **Navigate mode** (or press `Esc`).
7. When you are done, click **Save & Open Studio** on the toolbar or in the extension popup.
8. FlowPilot will open in a new tab with your tour fully pre-populated, ready to customize and publish!
