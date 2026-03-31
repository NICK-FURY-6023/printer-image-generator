#!/usr/bin/env node
/**
 * Generate a print-ready product label PDF (landscape, 300 DPI, B&W)
 * Layout: Left vertical strip | Logo + QR | Table | Description | Footer
 *
 * Usage: node scripts/generate-label-pdf.js [output.pdf]
 */

const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// ── Label data (edit these) ──────────────────────────────────────
const LABEL = {
  model: 'ALD-CHR-079N',
  brand: 'JAQUAR',
  productUrl: 'https://www.jaquar.com/in/product/ALD-CHR-079N',
  size: '15mm (1/2")',
  qty: '1',
  mrp: '₹3,800.00',
  description:
    'CONCEALED BODY FOR SINGLE LEVER HIGH FLOW DIVERTER WITH BUTTON ASSEMBLY, BUT WITHOUT EXPOSED PARTS',
  manufacturer: 'Jaquar & Company Pvt. Ltd.',
  address: 'Plot No. 1, Sector-3, IMT Manesar, Gurugram, Haryana - 122052, India',
};

// ── PDF dimensions (landscape label ~ 105mm × 60mm) ─────────────
const W = 105; // mm
const H = 60;  // mm
const STRIP_W = 8; // left vertical strip width

async function generateLabel() {
  const outFile = process.argv[2] || 'product-label.pdf';

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [H, W], // jsPDF: [height, width] for custom landscape
    compress: true,
  });

  // ── Helpers ──
  const setFont = (size, style = 'bold') => {
    pdf.setFont('helvetica', style);
    pdf.setFontSize(size);
  };
  const drawRect = (x, y, w, h, fill = false) => {
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.3);
    if (fill) {
      pdf.setFillColor(0);
      pdf.rect(x, y, w, h, 'F');
    } else {
      pdf.rect(x, y, w, h, 'S');
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // 1. LEFT VERTICAL STRIP — Model number rotated 90°
  // ══════════════════════════════════════════════════════════════════
  drawRect(0, 0, STRIP_W, H, true); // black filled strip
  pdf.setTextColor(255, 255, 255);
  setFont(9, 'bold');
  pdf.text(LABEL.model, STRIP_W / 2, H / 2, {
    angle: 90,
    align: 'center',
  });
  pdf.setTextColor(0); // reset to black

  // Content area starts after the strip
  const CX = STRIP_W + 2; // content X start
  const CW = W - STRIP_W - 4; // content width (with right margin)
  let curY = 3; // current Y cursor

  // ══════════════════════════════════════════════════════════════════
  // 2. TOP SECTION — Brand Logo (left) + QR Code (right)
  // ══════════════════════════════════════════════════════════════════
  const TOP_H = 14;

  // Brand logo — load from public/ and embed as image
  const logoPath = path.join(__dirname, '..', 'public', 'jaquar-logo.png');
  let logoLoaded = false;
  if (fs.existsSync(logoPath)) {
    try {
      const logoData = fs.readFileSync(logoPath);
      const base64 = 'data:image/png;base64,' + logoData.toString('base64');
      // Draw logo on left side (with grayscale filter via canvas would be ideal,
      // but jsPDF doesn't support filters — the logo is already mostly black)
      pdf.addImage(base64, 'PNG', CX, curY, 28, TOP_H - 1);
      logoLoaded = true;
    } catch (e) {
      // fallback to text
    }
  }
  if (!logoLoaded) {
    // Fallback: bold brand text
    setFont(16, 'bold');
    pdf.text(LABEL.brand, CX + 1, curY + TOP_H / 2 + 2);
  }

  // QR Code on right side
  try {
    const qrDataUrl = await QRCode.toDataURL(LABEL.productUrl, {
      width: 300,
      margin: 0,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' },
    });
    const qrSize = TOP_H - 1;
    pdf.addImage(qrDataUrl, 'PNG', CX + CW - qrSize, curY, qrSize, qrSize);
  } catch {
    // skip QR if generation fails
  }

  curY += TOP_H;

  // Thin separator line
  pdf.setLineWidth(0.3);
  pdf.line(CX, curY, CX + CW, curY);
  curY += 2;

  // ══════════════════════════════════════════════════════════════════
  // 3. MIDDLE SECTION — Table (Size | Qty | MRP)
  // ══════════════════════════════════════════════════════════════════
  const TABLE_X = CX + 2;
  const TABLE_W = CW - 4;
  const COL_W = [TABLE_W * 0.30, TABLE_W * 0.25, TABLE_W * 0.45];
  const ROW_H = 5.5;

  // Table header
  const headerLabels = ['Size', 'Qty', 'MRP (Per Piece)'];
  const headerValues = [LABEL.size, LABEL.qty, LABEL.mrp];

  // Draw header row (filled)
  pdf.setFillColor(0);
  pdf.rect(TABLE_X, curY, TABLE_W, ROW_H, 'F');
  setFont(7, 'bold');
  pdf.setTextColor(255, 255, 255);

  let colX = TABLE_X;
  for (let i = 0; i < 3; i++) {
    pdf.text(headerLabels[i], colX + COL_W[i] / 2, curY + ROW_H / 2 + 1, { align: 'center' });
    colX += COL_W[i];
  }

  curY += ROW_H;

  // Draw data row
  pdf.setTextColor(0);
  drawRect(TABLE_X, curY, TABLE_W, ROW_H);
  // vertical dividers
  pdf.line(TABLE_X + COL_W[0], curY, TABLE_X + COL_W[0], curY + ROW_H);
  pdf.line(TABLE_X + COL_W[0] + COL_W[1], curY, TABLE_X + COL_W[0] + COL_W[1], curY + ROW_H);

  setFont(7, 'normal');
  colX = TABLE_X;
  for (let i = 0; i < 3; i++) {
    const style = i === 2 ? 'bold' : 'normal';
    setFont(7, style);
    pdf.text(headerValues[i], colX + COL_W[i] / 2, curY + ROW_H / 2 + 1, { align: 'center' });
    colX += COL_W[i];
  }

  curY += ROW_H + 2.5;

  // ══════════════════════════════════════════════════════════════════
  // 4. PRODUCT DESCRIPTION — Center aligned, ALL CAPS
  // ══════════════════════════════════════════════════════════════════
  setFont(5.2, 'bold');
  const descLines = pdf.splitTextToSize(LABEL.description, CW - 4);
  pdf.text(descLines, CX + CW / 2, curY, { align: 'center', lineHeightFactor: 1.4 });

  curY += descLines.length * 2.8 + 2;

  // Thin separator
  pdf.setLineWidth(0.15);
  pdf.line(CX, curY, CX + CW, curY);
  curY += 1.5;

  // ══════════════════════════════════════════════════════════════════
  // 5. FOOTER — Manufacturer info
  // ══════════════════════════════════════════════════════════════════
  setFont(4, 'normal');
  pdf.text(`Manufactured by: ${LABEL.manufacturer}`, CX + 1, curY);
  curY += 2;

  // Wrap address if long
  setFont(3.8, 'normal');
  const addrLines = pdf.splitTextToSize(`Address: ${LABEL.address}`, CW - 2);
  pdf.text(addrLines, CX + 1, curY, { lineHeightFactor: 1.3 });

  // ══════════════════════════════════════════════════════════════════
  // 6. OUTER BORDER
  // ══════════════════════════════════════════════════════════════════
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(0);
  pdf.rect(0, 0, W, H, 'S');

  // ── Save ──
  const outPath = path.resolve(outFile);
  const buffer = Buffer.from(pdf.output('arraybuffer'));
  fs.writeFileSync(outPath, buffer);
  console.log(`✅ Label PDF generated: ${outPath}`);
  console.log(`   Size: ${(buffer.length / 1024).toFixed(1)} KB`);
  console.log(`   Dimensions: ${W}mm × ${H}mm (landscape)`);
  console.log(`   Model: ${LABEL.model}`);
}

generateLabel().catch((err) => {
  console.error('❌ Failed to generate label:', err.message);
  process.exit(1);
});
