const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Background
const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, '#08091a');
bg.addColorStop(0.5, '#0f0a28');
bg.addColorStop(1, '#08091a');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);

// Saffron radial glow top-right
const g1 = ctx.createRadialGradient(900, 100, 0, 900, 100, 450);
g1.addColorStop(0, 'rgba(249,115,22,0.16)');
g1.addColorStop(1, 'rgba(249,115,22,0)');
ctx.fillStyle = g1;
ctx.fillRect(0, 0, W, H);

// Purple glow bottom-left
const g2 = ctx.createRadialGradient(100, H, 0, 100, H, 350);
g2.addColorStop(0, 'rgba(124,58,237,0.1)');
g2.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = g2;
ctx.fillRect(0, 0, W, H);

// Top accent bar
const bar = ctx.createLinearGradient(0, 0, W, 0);
bar.addColorStop(0, '#f97316');
bar.addColorStop(1, '#ea580c');
ctx.fillStyle = bar;
ctx.fillRect(0, 0, W, 5);

// ── LEFT PANEL ─────────────────────────────────
// Brand logo box
const logoGrad = ctx.createLinearGradient(52, 60, 112, 120);
logoGrad.addColorStop(0, '#f97316');
logoGrad.addColorStop(1, '#c2410c');
ctx.fillStyle = logoGrad;
roundRect(52, 60, 60, 60, 12);
ctx.fill();

// Logo icon (layers/stack)
ctx.strokeStyle = 'white';
ctx.lineWidth = 2.2;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
// layer lines inside box
const lx = 82, ly = 90;
// top diamond
ctx.beginPath(); ctx.moveTo(lx, ly-14); ctx.lineTo(lx-12, ly-7); ctx.lineTo(lx, ly); ctx.lineTo(lx+12, ly-7); ctx.closePath(); ctx.stroke();
// mid line
ctx.beginPath(); ctx.moveTo(lx-12, ly-1); ctx.lineTo(lx, ly+6); ctx.lineTo(lx+12, ly-1); ctx.stroke();
// bottom line
ctx.beginPath(); ctx.moveTo(lx-12, ly+5); ctx.lineTo(lx, ly+12); ctx.lineTo(lx+12, ly+5); ctx.stroke();

// Brand name
ctx.fillStyle = '#f1f5f9';
ctx.font = 'bold 36px Arial';
ctx.fillText('Shree Ganpati Agency', 132, 92);

// Tagline
ctx.fillStyle = '#f97316';
ctx.font = 'bold 13px Arial';
ctx.fillText('LABEL PRINT SYSTEM  v2.0  —  ADMIN ACCESS ONLY', 134, 118);

// Horizontal divider
ctx.strokeStyle = '#1e293b';
ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(52, 148); ctx.lineTo(560, 148); ctx.stroke();

// Description
ctx.fillStyle = '#94a3b8';
ctx.font = '15px Arial';
ctx.fillText('Precision A4 label printing. 12 labels per sheet at exact 105x48mm.', 52, 176);
ctx.fillText('Cloud templates, PDF export, bulk fill — built for Shree Ganpati Agency.', 52, 200);

// Divider 2
ctx.strokeStyle = '#1e293b';
ctx.beginPath(); ctx.moveTo(52, 228); ctx.lineTo(560, 228); ctx.stroke();

// Feature bullets
const bullets = [
  { icon: 'print',  text: '12 Labels per A4 sheet — 105x48mm exact' },
  { icon: 'cloud',  text: 'Supabase cloud templates — save and reload' },
  { icon: 'pdf',    text: 'One-click PDF export — print or share' },
  { icon: 'bulk',   text: 'Bulk fill all 12 labels at once' },
];

bullets.forEach((b, i) => {
  const by = 258 + i * 42;
  // dot
  ctx.fillStyle = '#f97316';
  ctx.beginPath(); ctx.arc(63, by - 4, 4, 0, Math.PI * 2); ctx.fill();
  // text
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '14px Arial';
  ctx.fillText(b.text, 80, by);
});

// Stats row
const stats = [
  { v: '12',      l: 'Labels' },
  { v: '105x48',  l: 'mm Size' },
  { v: 'A4',      l: 'Format' },
  { v: '100%',    l: 'Accurate' },
];
stats.forEach((s, i) => {
  const sx = 52 + i * 130;
  const sy = 550;
  // pill bg
  ctx.fillStyle = 'rgba(249,115,22,0.08)';
  roundRect(sx, sy - 24, 118, 40, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(249,115,22,0.2)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // value
  ctx.fillStyle = '#f97316';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(s.v, sx + 12, sy + 4);
  // label
  ctx.fillStyle = '#64748b';
  ctx.font = '11px Arial';
  ctx.fillText(s.l, sx + 12 + ctx.measureText(s.v).width + 6, sy + 4);
});

// ── RIGHT PANEL: Sheet preview ──────────────────────
const shX = 640, shY = 30, shW = 510, shH = 570;

// Shadow
ctx.fillStyle = 'rgba(0,0,0,0.45)';
roundRect(shX + 8, shY + 10, shW, shH, 12);
ctx.fill();

// Sheet white bg
ctx.fillStyle = '#f8fafc';
roundRect(shX, shY, shW, shH, 12);
ctx.fill();

// Sheet top header
const shHdr = ctx.createLinearGradient(shX, shY, shX + shW, shY);
shHdr.addColorStop(0, '#f97316');
shHdr.addColorStop(1, '#ea580c');
ctx.fillStyle = shHdr;
roundRect(shX, shY, shW, 38, 12);
ctx.fill();
ctx.fillRect(shX, shY + 22, shW, 16); // flatten bottom corners of header

ctx.fillStyle = 'white';
ctx.font = 'bold 12px Arial';
ctx.fillText('A4 LABEL SHEET  —  12 LABELS  —  105 x 48mm  —  2 x 6 GRID', shX + 16, shY + 23);

// Grid of labels
const labelW = 236, labelH = 80;
const gx0 = shX + 10, gy0 = shY + 48;
const gap = 4;

const samples = [
  { n: 'Jaquar Diverter D-450', p: '3800', s: '3/4"',   m: 'Jaquar & Co. Pvt. Ltd.' },
  { n: 'Cera Wall Mixer',       p: '2200', s: '1/2"',   m: 'Cera Sanitaryware Ltd.' },
  { n: 'Hindware Basin Tap',    p: '980',  s: 'N/A',    m: 'Hindware Ltd.' },
  { n: 'Parryware Faucet P-22', p: '1450', s: '15mm',   m: 'Parryware Industries' },
  { n: 'Kohler Shower Head',    p: '5600', s: '8"',     m: 'Kohler Co.' },
  { n: 'Grohe SpeedClean',      p: '4200', s: 'Univ.',  m: 'Grohe AG Germany' },
  { n: 'Marc Water Heater 15L', p: '6800', s: '15L',    m: 'Marc Industries Ltd.' },
  { n: 'Varmora Wall Tile',     p: '45',   s: '30x60',  m: 'Varmora Granito Pvt.' },
  { n: 'Asian Paints Apex',     p: '320',  s: '1L',     m: 'Asian Paints Ltd.' },
  { n: 'Fevicol SH 1kg',        p: '185',  s: '1kg',    m: 'Pidilite Industries' },
  { n: 'Basmati Rice Premium',  p: '120',  s: '1kg',    m: 'Ganpati Foods Ltd.' },
  { n: 'Toor Dal Best',         p: '85',   s: '500g',   m: 'Ganpati Agency' },
];

for (let row = 0; row < 6; row++) {
  for (let col = 0; col < 2; col++) {
    const idx = row * 2 + col;
    const lx = gx0 + col * (labelW + gap);
    const ly = gy0 + row * (labelH + gap);
    const lb = samples[idx] || {};

    // Label bg
    ctx.fillStyle = 'white';
    roundRect(lx, ly, labelW, labelH, 3);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Left saffron bar
    ctx.fillStyle = '#f97316';
    ctx.fillRect(lx, ly, 3, labelH);

    // Brand name (top left)
    const brand = lb.m ? lb.m.split(' ')[0].toUpperCase() : 'BRAND';
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 7.5px Arial';
    ctx.fillText(brand.substring(0, 12), lx + 8, ly + 13);

    // QR box (top right)
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.4;
    roundRect(lx + labelW - 28, ly + 4, 24, 24, 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#374151';
    [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]].forEach(([dx, dy]) => {
      if ((dx + dy) % 2 === 0) ctx.fillRect(lx + labelW - 26 + dx * 6, ly + 6 + dy * 6, 5, 5);
    });

    // Divider 1
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(lx + 5, ly + 19); ctx.lineTo(lx + labelW - 5, ly + 19); ctx.stroke();

    // Product name
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 9px Arial';
    ctx.fillText((lb.n || '______').substring(0, 26), lx + 8, ly + 33);

    // Divider 2
    ctx.beginPath(); ctx.moveTo(lx + 5, ly + 40); ctx.lineTo(lx + labelW - 5, ly + 40); ctx.stroke();

    // Size | Qty | MRP
    ctx.fillStyle = '#6b7280'; ctx.font = '7px Arial';
    ctx.fillText('Size:', lx + 8, ly + 53);
    ctx.fillStyle = '#111827'; ctx.font = 'bold 7px Arial';
    ctx.fillText(lb.s || '____', lx + 30, ly + 53);

    ctx.fillStyle = '#6b7280'; ctx.font = '7px Arial';
    ctx.fillText('Qty:', lx + 85, ly + 53);
    ctx.fillStyle = '#111827'; ctx.font = 'bold 7px Arial';
    ctx.fillText('1 pc', lx + 105, ly + 53);

    ctx.fillStyle = '#6b7280'; ctx.font = '7px Arial';
    ctx.fillText('MRP:', lx + 155, ly + 53);
    ctx.fillStyle = '#dc2626'; ctx.font = 'bold 8.5px Arial';
    ctx.fillText('Rs.' + lb.p, lx + 178, ly + 53);

    // Divider 3
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath(); ctx.moveTo(lx + 5, ly + 60); ctx.lineTo(lx + labelW - 5, ly + 60); ctx.stroke();

    // Manufacturer
    ctx.fillStyle = '#9ca3af'; ctx.font = '6.5px Arial';
    ctx.fillText((lb.m || '______').substring(0, 34), lx + 8, ly + 72);
  }
}

// ── Bottom bar
ctx.fillStyle = '#0f172a';
ctx.fillRect(0, H - 44, W, 44);
ctx.fillStyle = '#1e293b';
ctx.fillRect(0, H - 44, W, 1);

// Left: brand name in footer
ctx.fillStyle = '#334155';
ctx.font = 'bold 12px Arial';
ctx.textAlign = 'left';
ctx.fillText('Shree Ganpati Agency — Label Print System v2.0', 52, H - 15);

// Right: URL
ctx.fillStyle = '#1e293b';
ctx.font = '11px Arial';
ctx.textAlign = 'right';
ctx.fillText('printer-image-generator.vercel.app', W - 52, H - 15);

// Save
const outPath = path.join(__dirname, '../public/og-image.png');
const buf = canvas.toBuffer('image/png');
fs.writeFileSync(outPath, buf);
console.log('OG image saved:', Math.round(buf.length / 1024) + 'KB');
