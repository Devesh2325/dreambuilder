import React, { useMemo } from 'react';
import { ExperiencePlayer, PlayerHost } from '../../experience/ExperiencePlayer';
import { buildContent, el } from '../../templates/dsl';
import { THEME_INDIGO } from '../../templates/themes';

const svgUrl = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;
const INDIGO = '#4f46e5';

const frame = (body: string) => svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 760" font-family="system-ui,-apple-system,Segoe UI,sans-serif"><rect width="1280" height="760" fill="#f8fafc"/>${body}</svg>`);

const text = (x: number, y: number, value: string, size = 16, weight = 400, fill = '#0f172a', anchor = 'start') =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${value}</text>`;
const box = (x: number, y: number, width: number, height: number, fill = '#fff', stroke = '#e2e8f0', radius = 12) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}"/>`;
const bar = (x: number, y: number, width: number, height = 10, fill = '#e2e8f0') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${fill}"/>`;

const topBar = (title: string, action: string) => `<rect width="1280" height="64" fill="#fff"/><rect y="64" width="1280" height="1" fill="#e2e8f0"/>
<rect x="24" y="16" width="32" height="32" rx="9" fill="${INDIGO}"/>${text(40, 38, 'F', 16, 800, '#fff', 'middle')}${text(68, 38, title, 18, 700)}
<rect x="1096" y="14" width="160" height="36" rx="9" fill="${INDIGO}"/>${text(1176, 37, action, 14, 600, '#fff', 'middle')}`;

const miniPage = (x: number, y: number, width: number, height: number, name: string, tag: string, colors: [string, string]) => `
${box(x, y, width, height)}
<defs><linearGradient id="g${x}${y}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs>
<path d="M${x + 12} ${y}h${width - 24}a12 12 0 0 1 12 12v${height - 96}h-${width}v-${height - 96}a12 12 0 0 1 12-12z" fill="url(#g${x}${y})"/>
${bar(x + 24, y + 34, width * 0.55, 14, 'rgba(255,255,255,.95)')}${bar(x + 24, y + 58, width * 0.4, 9, 'rgba(255,255,255,.7)')}
<rect x="${x + 24}" y="${y + 80}" width="76" height="24" rx="6" fill="#fff"/>
${text(x + 18, y + height - 54, name, 15, 700)}${text(x + 18, y + height - 30, tag, 13, 400, '#64748b')}`;

const SCREEN_TEMPLATES = frame(`${topBar('Choose a template', 'Start blank')}
${text(48, 118, 'Templates for your industry', 26, 800)}
${['All', 'Restaurants', 'Clinics', 'Real estate', 'Gyms', 'Software'].map((name, i) => `<rect x="${48 + i * 124}" y="140" width="112" height="34" rx="17" fill="${i === 0 ? INDIGO : '#fff'}" stroke="${i === 0 ? INDIGO : '#e2e8f0'}"/>${text(104 + i * 124, 162, name, 13, 600, i === 0 ? '#fff' : '#334155', 'middle')}`).join('')}
${miniPage(48, 200, 376, 240, 'Restaurant', 'Menu, booking, gallery', ['#f97316', '#be123c'])}
${miniPage(452, 200, 376, 240, 'Clinic', 'Doctors, services, contact', ['#0ea5e9', '#0f766e'])}
${miniPage(856, 200, 376, 240, 'Software', 'Features, pricing, FAQ', ['#6366f1', '#a855f7'])}
${miniPage(48, 464, 376, 240, 'Gym', 'Classes, trainers, offer', ['#111827', '#dc2626'])}
${miniPage(452, 464, 376, 240, 'Real estate', 'Listings, agents, contact', ['#0f766e', '#65a30d'])}
${miniPage(856, 464, 376, 240, 'Hotel', 'Rooms, gallery, booking', ['#1e3a8a', '#0891b2'])}`);

const formField = (y: number, label: string, value: string) => `${text(48, y, label, 14, 600, '#334155')}${box(48, y + 10, 400, 44, '#fff', '#cbd5e1', 9)}${text(62, y + 38, value, 15)}`;

const SCREEN_DETAILS = frame(`${topBar('Add your details', 'Create website')}
${box(0, 65, 496, 695, '#fff', '#e2e8f0', 0)}
${text(48, 118, 'Tell us about your business', 22, 800)}
${formField(162, 'Business name', 'Bella Pasta')}${formField(250, 'Tagline', 'Fresh pasta, made every morning')}${formField(338, 'Phone', '+1 555 0147')}${formField(426, 'Address', '12 Market Street')}
${text(48, 526, 'Brand color', 14, 600, '#334155')}
${['#be123c', '#f97316', '#059669', '#2563eb', '#7c3aed'].map((color, i) => `<circle cx="${68 + i * 48}" cy="560" r="16" fill="${color}"${i === 0 ? ' stroke="#0f172a" stroke-width="3"' : ''}/>`).join('')}
${box(530, 96, 718, 632)}
<rect x="530" y="96" width="718" height="44" rx="12" fill="#fff"/>${text(556, 125, 'Bella Pasta', 17, 800, '#be123c')}${['Menu', 'About', 'Book'].map((name, i) => text(1040 + i * 66, 125, name, 13, 500, '#475569')).join('')}
<rect x="531" y="140" width="716" height="320" fill="#be123c"/>${text(890, 270, 'Bella Pasta', 48, 800, '#fff', 'middle')}${text(890, 312, 'Fresh pasta, made every morning', 20, 400, '#ffe4e6', 'middle')}
<rect x="810" y="344" width="160" height="44" rx="9" fill="#fff"/>${text(890, 372, 'Book a table', 15, 700, '#be123c', 'middle')}
${[0, 1, 2].map((i) => `${box(566 + i * 222, 490, 202, 200)}${bar(586 + i * 222, 620, 150, 12, '#334155')}${bar(586 + i * 222, 644, 110)}<circle cx="${667 + i * 222}" cy="560" r="36" fill="#fecdd3"/>`).join('')}`);

const panelRow = (y: number, label: string, value: string) => `${text(92, y, label, 13, 600, '#334155')}${box(92, y + 8, 272, 36, '#fff', '#cbd5e1', 8)}${text(104, y + 32, value, 14)}`;

const SCREEN_EDITOR = frame(`<rect width="1280" height="56" fill="#fff"/><rect y="56" width="1280" height="1" fill="#e2e8f0"/>
${text(24, 35, 'Bella Pasta', 16, 700)}${text(130, 35, 'Saved', 13, 500, '#059669')}
<rect x="530" y="12" width="220" height="32" rx="8" fill="#f1f5f9"/>${['Desktop', 'Tablet', 'Mobile'].map((name, i) => text(570 + i * 72, 33, name, 12, i === 0 ? 700 : 500, i === 0 ? INDIGO : '#64748b', 'middle')).join('')}
<rect x="1066" y="12" width="88" height="32" rx="8" fill="#fff" stroke="#cbd5e1"/>${text(1110, 33, 'Preview', 13, 600, '#334155', 'middle')}<rect x="1164" y="12" width="92" height="32" rx="8" fill="${INDIGO}"/>${text(1210, 33, 'Publish', 13, 600, '#fff', 'middle')}
<rect y="57" width="68" height="703" fill="#fff"/><rect x="68" y="57" width="1" height="703" fill="#e2e8f0"/>
${['Edit', 'Add', 'Variables', 'Layers', 'Pages', 'Theme'].map((name, i) => `<rect x="6" y="${68 + i * 58}" width="56" height="50" rx="11" fill="${i === 0 ? '#eef2ff' : 'transparent'}"/><rect x="24" y="${78 + i * 58}" width="20" height="16" rx="4" fill="${i === 0 ? INDIGO : '#94a3b8'}"/>${text(34, 108 + i * 58, name, 10.5, 500, i === 0 ? INDIGO : '#475569', 'middle')}`).join('')}
<rect x="69" y="57" width="320" height="703" fill="#fff"/><rect x="389" y="57" width="1" height="703" fill="#e2e8f0"/>
${text(92, 92, 'Heading', 16, 700)}${['Content', 'Style', 'Behavior'].map((name, i) => text(92 + i * 76, 124, name, 13, 600, i === 1 ? INDIGO : '#64748b')).join('')}<rect x="168" y="134" width="44" height="2" fill="${INDIGO}"/>
${panelRow(164, 'Font size', '48')}${panelRow(232, 'Text color', '#ffffff')}
${text(92, 312, 'Fill', 13, 600, '#334155')}<defs><linearGradient id="gf" x1="0" x2="1"><stop offset="0" stop-color="#be123c"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs><rect x="92" y="322" width="272" height="36" rx="8" fill="url(#gf)"/>
${text(92, 392, 'All padding', 13, 600, '#334155')}${['None', 'S', 'M', 'L', 'XL'].map((name, i) => `<rect x="${92 + i * 55}" y="402" width="50" height="32" rx="7" fill="${i === 3 ? '#eef2ff' : '#f1f5f9'}"/>${text(117 + i * 55, 423, name, 12, 600, i === 3 ? INDIGO : '#475569', 'middle')}`).join('')}
<rect x="390" y="57" width="890" height="703" fill="#e2e8f0"/>
<rect x="414" y="78" width="842" height="660" rx="8" fill="#fff"/>
<rect x="414" y="78" width="842" height="48" rx="8" fill="#fff"/>${text(444, 109, 'Bella Pasta', 18, 800, '#be123c')}
<defs><linearGradient id="gh" x1="0" x2="1"><stop offset="0" stop-color="#be123c"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs><rect x="414" y="126" width="842" height="340" fill="url(#gh)"/>
${text(835, 280, 'Bella Pasta', 52, 800, '#fff', 'middle')}${text(835, 324, 'Fresh pasta, made every morning', 20, 400, '#ffe4e6', 'middle')}
<rect x="618" y="232" width="434" height="66" fill="none" stroke="#6366f1" stroke-width="2"/><rect x="618" y="204" width="130" height="26" rx="6" fill="#6366f1"/>${text(632, 222, 'Heading', 12, 600, '#fff')}
<rect x="755" y="360" width="160" height="44" rx="9" fill="#fff"/>${text(835, 388, 'Book a table', 15, 700, '#be123c', 'middle')}
${[0, 1, 2].map((i) => `${box(444 + i * 266, 496, 248, 214)}<circle cx="${568 + i * 266}" cy="570" r="40" fill="#fecdd3"/>${bar(474 + i * 266, 640, 188, 12, '#334155')}${bar(474 + i * 266, 664, 130)}`).join('')}`);

const SCREEN_LIVE = frame(`${topBar('Bella Pasta is live', 'Open site')}
<circle cx="640" cy="170" r="52" fill="#10b981"/><path d="M616 170l17 17 32-36" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
${text(640, 268, 'Your website is live', 34, 800, '#0f172a', 'middle')}${text(640, 302, 'Share your link, or add it to the site you already have.', 17, 400, '#475569', 'middle')}
${box(330, 332, 620, 56, '#fff', '#cbd5e1', 10)}${text(354, 366, 'flowpilot.app/s/bella-pasta', 17, 600, INDIGO)}<rect x="850" y="342" width="88" height="36" rx="8" fill="${INDIGO}"/>${text(894, 365, 'Copy', 14, 600, '#fff', 'middle')}
${[['Views', '1,284'], ['Bookings', '47'], ['Button clicks', '312']].map(([label, value], i) => `${box(330 + i * 214, 424, 192, 112)}${text(350 + i * 214, 462, label, 14, 500, '#64748b')}${text(350 + i * 214, 508, value, 32, 800)}`).join('')}
${text(640, 586, 'Sample numbers, for this demo', 13, 400, '#94a3b8', 'middle')}
${box(330, 610, 620, 100, '#fff', '#e2e8f0', 12)}${text(354, 646, 'Every publish is saved', 16, 700)}${text(354, 676, 'Version 3 is live. You can go back to an earlier one at any time.', 14, 400, '#475569')}`);

const hotspot = (x: number, y: number, title: string, tip: string, buttonText: string, placement: string, align = 'center') =>
  el('DemoHotspot', { props: { x, y, title, tip, buttonText, placement, align, showBeacon: true, goTo: '' } });

const buildDemo = () => buildContent('d', [
  el('DemoScreen', { props: { image: SCREEN_TEMPLATES, alt: 'Choosing a template for your industry' } }, [
    hotspot(16, 42, 'Start with a design', 'Pick a template made for your industry. It already looks finished.', 'Use this one', 'right', 'start'),
  ]),
  el('DemoScreen', { props: { image: SCREEN_DETAILS, alt: 'Filling in your details beside a live preview' } }, [
    hotspot(36, 29, 'Add your details', 'Fill in a simple form. The page on the right updates as you type, everywhere your name appears.', 'Next', 'right', 'start'),
  ]),
  el('DemoScreen', { props: { image: SCREEN_EDITOR, alt: 'Changing the design in the visual editor' } }, [
    hotspot(29, 47, 'Change anything', 'Click a block to change its fonts, colors, gradient and spacing, for each screen size. No code.', 'Next', 'right', 'start'),
  ]),
  el('DemoScreen', { props: { image: SCREEN_LIVE, alt: 'The published website with its web address' } }, [
    hotspot(50, 47, 'You are live', 'Publish, and share your link. Now it is your turn.', 'Finish', 'bottom'),
  ]),
]);

const SETTINGS = {};
const NO_VARIABLES = {};

/**
 * Made of the same blocks as a customer's demo, and played by the same player. The screens are
 * drawings rather than screenshots so they stay sharp and small.
 */
export const ProductDemo: React.FC = () => {
  const content = useMemo(buildDemo, []);
  const host = useMemo<PlayerHost>(() => ({ targetDocument: document }), []);
  return <ExperiencePlayer type="demo" content={content} theme={THEME_INDIGO.theme} variables={NO_VARIABLES} settings={SETTINGS} host={host} />;
};
