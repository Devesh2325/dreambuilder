// Starting images for templates. Users replace these with their own, under Variables.

const PHOTOS = {
  restaurant: '1517248135467-4c7edcad34c4', food: '1504674900247-0877df9cc836', pizza: '1565299624946-b28f40a0ae38', dessert: '1551024506-0bccd828d307',
  clinic: '1519494026892-80bbd2d6fd0d', doctor: '1576091160399-112ba8d25d1d', house: '1568605114967-8130f3a36994', interior: '1600585154340-be6161a56a0c',
  gym: '1534438327276-14e5300c3a48', yoga: '1506126613408-eca07ce68773', salon: '1560066984-138dadb4c035', law: '1589829545856-d10d557cf95f',
  study: '1503676260728-1c00da094a0b', hotel: '1566073771259-6a8506099945', travel: '1507525428034-b723cf961d3e', office: '1497366216548-37526070297c',
  team: '1522071820081-009f0129c71c', laptop: '1498050108023-c5249f4df085', dashboard: '1551288049-bebda4e38f71', coding: '1461749280684-dccba630e2f6',
  charity: '1488521787991-ed7bbaae773c', camera: '1516035069371-29a1b244cc32', shop: '1441986300917-64674bd600d8', writing: '1455390582262-044cdead277a',
  books: '1481627834876-b7833e8f5570', construction: '1504307651254-35680f356dfd', car: '1486262715619-67b85e0b08d3', meeting: '1552664730-d307ca884978',
  phone: '1512941937669-90a1b58e7e9c', event: '1540575467063-178a50c2df87', mug: '1514228742587-6b1558fcca3d', sofa: '1555041469-a586c61ea9bc',
  ceramics: '1578749556568-bc2c40e68b61', design: '1561070791-2526d30994b5', cleaning: '1581578731548-c64695cc6952',
} as const;

export type PhotoName = keyof typeof PHOTOS;

export const photo = (name: PhotoName, width = 1200, height = 800) =>
  `https://images.unsplash.com/photo-${PHOTOS[name]}?w=${width}&h=${height}&q=75&auto=format&fit=crop`;

const svgUrl = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

const shell = (accent: string, title: string, body: string) => svgUrl(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 800" font-family="system-ui,sans-serif">
<rect width="1280" height="800" fill="#f1f5f9"/>
<rect width="220" height="800" fill="#0f172a"/>
<rect x="24" y="26" width="28" height="28" rx="8" fill="${accent}"/><rect x="62" y="33" width="96" height="14" rx="7" fill="#e2e8f0"/>
${[96, 142, 188, 234, 280].map((y, i) => `<rect x="16" y="${y}" width="188" height="36" rx="8" fill="${i === 0 ? accent : 'transparent'}"/><rect x="32" y="${y + 12}" width="${[92, 110, 76, 100, 64][i]}" height="12" rx="6" fill="${i === 0 ? '#fff' : '#64748b'}"/>`).join('')}
<rect x="220" width="1060" height="72" fill="#fff"/>
<text x="252" y="45" font-size="24" font-weight="700" fill="#0f172a">${title}</text>
<rect x="1096" y="18" width="150" height="38" rx="9" fill="${accent}"/><rect x="1124" y="31" width="94" height="12" rx="6" fill="#fff"/>
${body}</svg>`,
);

const card = (x: number, y: number, width: number, height: number, inner = '') =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="14" fill="#fff" stroke="#e2e8f0"/>${inner}`;

const stat = (x: number, label: string, value: string, accent: string) =>
  card(x, 100, 240, 124, `<text x="${x + 22}" y="142" font-size="15" fill="#64748b">${label}</text><text x="${x + 22}" y="190" font-size="36" font-weight="700" fill="#0f172a">${value}</text><rect x="${x + 170}" y="150" width="48" height="40" rx="8" fill="${accent}" opacity=".16"/>`);

const bars = (accent: string) =>
  [62, 104, 84, 150, 122, 180, 138, 210, 166, 232, 196, 258]
    .map((height, i) => `<rect x="${288 + i * 58}" y="${720 - height}" width="34" height="${height}" rx="6" fill="${accent}" opacity="${0.45 + i * 0.045}"/>`)
    .join('');

const rows = (accent: string, count = 6) =>
  Array.from({ length: count }, (_, i) => {
    const y = 176 + i * 88;
    return `<rect x="264" y="${y}" width="972" height="72" rx="12" fill="#fff" stroke="#e2e8f0"/><circle cx="304" cy="${y + 36}" r="18" fill="${accent}" opacity=".2"/><rect x="340" y="${y + 20}" width="${200 + (i % 3) * 50}" height="12" rx="6" fill="#334155"/><rect x="340" y="${y + 42}" width="${130 + (i % 2) * 60}" height="10" rx="5" fill="#cbd5e1"/><rect x="1110" y="${y + 22}" width="96" height="28" rx="14" fill="${i % 3 === 0 ? accent : '#e2e8f0'}" opacity="${i % 3 === 0 ? 0.85 : 1}"/>`;
  }).join('');

/** Realistic-looking product screens, so a demo template shows a product straight away. */
export const mockScreen = (kind: 'dashboard' | 'list' | 'detail' | 'report' | 'success', accent = '#4f46e5') => {
  switch (kind) {
    case 'dashboard':
      return shell(accent, 'Dashboard', `${stat(252, 'Revenue', '$48.2k', accent)}${stat(512, 'Customers', '1,284', accent)}${stat(772, 'Conversion', '6.4%', accent)}${stat(1032 - 12, 'Tickets', '32', accent)}${card(252, 248, 996, 512, '<text x="284" y="292" font-size="18" font-weight="600" fill="#0f172a">Monthly growth</text>')}${bars(accent)}`);
    case 'list':
      return shell(accent, 'Customers', `<rect x="264" y="100" width="420" height="52" rx="10" fill="#fff" stroke="#e2e8f0"/><rect x="288" y="120" width="170" height="12" rx="6" fill="#cbd5e1"/>${rows(accent)}`);
    case 'detail':
      return shell(accent, 'Customer details', `${card(252, 100, 640, 660, '<circle cx="312" cy="170" r="36" fill="#e2e8f0"/><rect x="366" y="150" width="240" height="16" rx="8" fill="#334155"/><rect x="366" y="178" width="170" height="12" rx="6" fill="#cbd5e1"/>')}${[250, 322, 394, 466, 538].map((y) => `<rect x="284" y="${y}" width="150" height="10" rx="5" fill="#94a3b8"/><rect x="284" y="${y + 20}" width="570" height="26" rx="6" fill="#f1f5f9"/>`).join('')}<rect x="284" y="640" width="170" height="46" rx="10" fill="${accent}"/><rect x="326" y="657" width="86" height="12" rx="6" fill="#fff"/>${card(916, 100, 332, 300, '<rect x="940" y="130" width="150" height="14" rx="7" fill="#334155"/>')}${card(916, 424, 332, 336, '<rect x="940" y="454" width="120" height="14" rx="7" fill="#334155"/>')}`);
    case 'report':
      return shell(accent, 'Reports', `${card(252, 100, 996, 400, '<text x="284" y="146" font-size="18" font-weight="600" fill="#0f172a">Performance this quarter</text>')}<polyline fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" points="288,430 390,392 492,410 594,322 696,346 798,252 900,280 1002,206 1104,226 1206,172"/>${stat(252, 'Active', '842', accent).replace(/y="100"/, 'y="524"').replace(/y="142"/, 'y="566"').replace(/y="190"/, 'y="614"').replace(/y="150"/, 'y="574"')}${stat(512, 'New', '129', accent).replace(/y="100"/, 'y="524"').replace(/y="142"/, 'y="566"').replace(/y="190"/, 'y="614"').replace(/y="150"/, 'y="574"')}${stat(772, 'Lost', '14', accent).replace(/y="100"/, 'y="524"').replace(/y="142"/, 'y="566"').replace(/y="190"/, 'y="614"').replace(/y="150"/, 'y="574"')}`);
    case 'success':
      return shell(accent, 'All done', `${card(452, 170, 596, 460, `<circle cx="750" cy="300" r="62" fill="${accent}"/><path d="M722 300l20 20 38-42" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><text x="750" y="420" text-anchor="middle" font-size="30" font-weight="700" fill="#0f172a">You're all set</text><rect x="600" y="450" width="300" height="12" rx="6" fill="#cbd5e1"/><rect x="660" y="520" width="180" height="48" rx="10" fill="${accent}"/>`)}`);
  }
};
