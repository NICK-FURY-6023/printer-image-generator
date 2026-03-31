import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { generateMfgDate } from '../utils/mfgDate';
import { dynamicImport } from '../utils/dynamicImport';
import LabelSheet from './LabelSheet';

const A4_W = 794;
const A4_H = 1123;

function Icon({ d, size = 14, sw = 1.75 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

function ToolBtn({ onClick, disabled, title, children, variant = 'ghost', style: extra = {} }) {
  const variants = {
    ghost:   { background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', border: '1px solid #334155' },
    saffron: { background: 'linear-gradient(135deg,#ea580c,#c2410c)', color: 'white', border: 'none' },
    blue:    { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', border: 'none' },
    green:   { background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' },
  };
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      title={title}
      style={{
        borderRadius: 8, fontWeight: 600, fontSize: 12, padding: '7px 13px',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
        ...variants[variant], ...extra,
      }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseOut={e  => { if (!disabled) e.currentTarget.style.opacity = '1'; }}
    >
      {children}
    </button>
  );
}

export default function LabelPreview({
  labels,
  pages,
  onSave, onLoad, onPrint,
  copies = 1, onCopiesChange,
  fontScale = 1, onFontScaleChange,
  fieldStyles, onFieldStylesChange,
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.6);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [printMargin, setPrintMargin] = useState(0);
  const [showCalibration, setShowCalibration] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const w = el.clientWidth - 48;
      const h = el.clientHeight - 200;
      setScale(Math.min(w / A4_W, h / A4_H, 1));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    const tid = toast.loading('Generating PDF…');
    try {
      const { default: jsPDF } = await dynamicImport(() => import('jspdf'));
      const QRLib = (await dynamicImport(() => import('qrcode'))).default;

      const pdf = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait', compress: true });

      // ── Layout constants (must match CSS .sheet grid) ──
      const PX = 3.5, GAP = 1;
      const PY_TOP = 7 + printMargin, PY_BOT = 7 - printMargin;
      const CW = (210 - PX * 2 - GAP) / 2;
      const CH = (297 - PY_TOP - PY_BOT - GAP * 5) / 6;
      const LOGO_W = 18;
      const s = (pt) => pt * fontScale;
      const PT2MM = 0.3528;

      // ── Pre-load images (proxy external URLs for CORS) ──
      function proxyUrl(url) {
        if (!url) return url;
        if (url.startsWith('https://www.jaquar.com/')) {
          return `/api/image-proxy?url=${encodeURIComponent(url)}`;
        }
        return url;
      }

      async function loadImg(url) {
        if (!url) return null;
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = proxyUrl(url);
          await new Promise((r, e) => { img.onload = r; img.onerror = () => e(new Error('load failed')); });
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          c.getContext('2d').drawImage(img, 0, 0);
          return { data: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight };
        } catch { return null; }
      }

      const allPages = pages || [labels];

      // ── Pre-load images for ALL pages ──
      const logoCache = {};
      const qrCache = {};
      const prodImgCache = {};
      for (const pageLabels of allPages) {
        const safeLabels = Array.from({ length: 12 }, (_, i) => ({
          product: '', code: '', price: '', manufacturer: '', logoUrl: '', description: '', productUrl: '', productImage: '',
          ...(pageLabels[i] || {})
        }));
        for (const l of safeLabels) {
          const url = l.logoUrl?.trim() || '/jaquar-logo.png';
          if (!logoCache[url]) logoCache[url] = await loadImg(url);
        }
        for (const l of safeLabels) {
          const url = l.productUrl?.trim();
          if (url && !qrCache[url]) {
            try { qrCache[url] = await QRLib.toDataURL(url, { width: 200, margin: 0, errorCorrectionLevel: 'M' }); }
            catch { /* skip */ }
          }
        }
        for (const l of safeLabels) {
          const url = l.productImage?.trim();
          if (url && !prodImgCache[url]) prodImgCache[url] = await loadImg(url);
        }
      }

      // ── Helper: fit image maintaining aspect ratio ──
      function fitImg(img, maxW, maxH) {
        const scale = Math.min(maxW / img.w, maxH / img.h);
        return { w: img.w * scale, h: img.h * scale };
      }

      // ── Render all pages × copies ──
      let isFirstPage = true;
      for (let copy = 0; copy < copies; copy++) {
        for (let pageIdx = 0; pageIdx < allPages.length; pageIdx++) {
          if (!isFirstPage) pdf.addPage();
          isFirstPage = false;
          const page = Array.isArray(allPages[pageIdx]) ? allPages[pageIdx] : [];
          const safeLabels = Array.from({ length: 12 }, (_, i) => page[i] || {});

        for (let idx = 0; idx < 12; idx++) {
          const label = safeLabels[idx];
          const col = idx % 2, row = Math.floor(idx / 2);
          const cx = PX + col * (CW + GAP);
          const cy = PY_TOP + row * (CH + GAP);

          // Cell border (thicker for premium look)
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.35);
          pdf.rect(cx, cy, CW, CH);

          // ── LEFT VERTICAL STRIP — white with black rotated model number ──
          const STRIP_W = 5.5;
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.12);
          pdf.line(cx + STRIP_W, cy, cx + STRIP_W, cy + CH);

          const code = label.code?.trim() || '';
          if (code) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(s(5));
            pdf.setFont('helvetica', 'bold');
            // Truncate code if it exceeds strip height
            const maxCodeW = CH - 2;
            let codeText = code;
            while (pdf.getTextWidth(codeText) > maxCodeW && codeText.length > 3) {
              codeText = codeText.slice(0, -1);
            }
            pdf.text(codeText, cx + STRIP_W / 2, cy + CH / 2, { angle: 90, align: 'center' });
          }

          // Content area after the strip
          const contentX = cx + STRIP_W + 0.8;
          const contentW = CW - STRIP_W - 1.5;
          let curY = cy + 0.5;

          // ── TOP ROW: Brand Logo + QR Code (side by side, left) ──
          const TOP_H = 8;
          const logoUrl = label.logoUrl?.trim() || '/jaquar-logo.png';
          const logo = logoCache[logoUrl];
          let logoEndX = contentX;
          if (logo) {
            const pad = 0.5;
            const fit = fitImg(logo, 24, TOP_H - pad * 2);
            try {
              pdf.addImage(logo.data, 'PNG',
                contentX, curY + (TOP_H - fit.h) / 2, fit.w, fit.h);
              logoEndX = contentX + fit.w + 1.5;
            } catch { /* skip */ }
          } else {
            const brand = label.manufacturer?.trim();
            if (brand) {
              pdf.setFontSize(s(8));
              pdf.setFont('helvetica', 'bold');
              const brandText = brand.toUpperCase();
              // Truncate brand if wider than content area
              const maxBrandW = contentW - 12;
              let displayBrand = brandText;
              while (pdf.getTextWidth(displayBrand) > maxBrandW && displayBrand.length > 2) {
                displayBrand = displayBrand.slice(0, -1);
              }
              pdf.text(displayBrand, contentX + 0.5, curY + TOP_H / 2 + 0.8);
              logoEndX = contentX + pdf.getTextWidth(displayBrand) + 2;
            }
          }

          // QR code — right next to logo
          const pUrl = label.productUrl?.trim();
          const qrData = pUrl ? qrCache[pUrl] : null;
          if (qrData) {
            const qrSize = TOP_H - 1.5;
            try {
              pdf.addImage(qrData, 'PNG',
                logoEndX, curY + 0.5, qrSize, qrSize);
            } catch { /* skip */ }
          }

          curY += TOP_H;
          pdf.setLineWidth(0.12);
          pdf.line(cx + STRIP_W, curY, cx + CW, curY);
          curY += 0.3;

          // ── TABLE: Size | Qty | MRP ──
          const HDR_H = 2.5;  // header row height
          const DATA_H = 4;   // data row height (taller for MRP + subtext)
          const TABLE_H = HDR_H + DATA_H;
          const tblX = contentX;
          const tblW = contentW;
          const col1W = tblW * 0.28, col2W = tblW * 0.22, col3W = tblW * 0.50;

          // Header row (white bg, bordered)
          pdf.setDrawColor(0);
          pdf.setLineWidth(0.12);
          pdf.rect(tblX, curY, tblW, HDR_H);
          pdf.line(tblX + col1W, curY, tblX + col1W, curY + HDR_H);
          pdf.line(tblX + col1W + col2W, curY, tblX + col1W + col2W, curY + HDR_H);
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(s(4));
          pdf.setFont('helvetica', 'bold');
          const hdrMid = curY + HDR_H / 2 + 0.4;
          pdf.text('Size', tblX + col1W / 2, hdrMid, { align: 'center' });
          pdf.text('Qty', tblX + col1W + col2W / 2, hdrMid, { align: 'center' });
          pdf.text('MRP (Per Piece)', tblX + col1W + col2W + col3W / 2, hdrMid, { align: 'center' });
          pdf.setTextColor(0, 0, 0);

          // Data row
          const dataY = curY + HDR_H;
          pdf.setDrawColor(0);
          pdf.setLineWidth(0.12);
          pdf.rect(tblX, dataY, tblW, DATA_H);
          pdf.line(tblX + col1W, dataY, tblX + col1W, dataY + DATA_H);
          pdf.line(tblX + col1W + col2W, dataY, tblX + col1W + col2W, dataY + DATA_H);

          const sizeVal = label.size?.trim() || '—';
          const qtyVal = label.qty?.trim() || '—';
          const priceVal = label.price?.trim() ? `\u20B9${label.price.trim()}` : '—';
          const fitText = (txt, maxW) => { const t = pdf.splitTextToSize(txt, maxW - 0.6); return t[0] || txt; };

          // Size & Qty — vertically centered in data row
          pdf.setFontSize(s(4.5));
          pdf.setFont('helvetica', 'normal');
          const dataMid = dataY + DATA_H / 2 + 0.4;
          pdf.text(fitText(sizeVal, col1W), tblX + col1W / 2, dataMid, { align: 'center' });
          pdf.text(fitText(qtyVal, col2W), tblX + col1W + col2W / 2, dataMid, { align: 'center' });

          // MRP — price + subtext both centered inside cell
          const mrpCenterX = tblX + col1W + col2W + col3W / 2;
          if (label.price?.trim()) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(s(4.5));
            pdf.text(fitText(priceVal, col3W), mrpCenterX, dataY + DATA_H * 0.35 + 0.3, { align: 'center' });
            pdf.setFontSize(s(2.2));
            pdf.setFont('helvetica', 'normal');
            pdf.text('(Incl. of All Taxes)', mrpCenterX, dataY + DATA_H * 0.35 + 1.9, { align: 'center' });
          } else {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(s(4.5));
            pdf.text('—', mrpCenterX, dataMid, { align: 'center' });
          }

          curY += TABLE_H + 0.5;
          pdf.setLineWidth(0.12);
          pdf.line(cx + STRIP_W, curY, cx + CW, curY);
          curY += 0.5;

          // ── PRODUCT NAME + DESCRIPTION + PRODUCT IMAGE ──
          const productName = label.product?.trim() || '';
          const desc = label.description?.trim() || '';
          const prodImgUrl = label.productImage?.trim() || '';
          const prodImg = prodImgUrl ? prodImgCache[prodImgUrl] : null;
          const footerY = cy + CH - 6.5; // must match footerTop below
          const PAD = 0.6; // internal padding from borders
          const midAvailH = footerY - curY - PAD;

          // Product image on right side
          const IMG_COL_W = prodImg ? 11 : 0;
          const textW = contentW - IMG_COL_W - (prodImg ? 1 : 0) - PAD;

          if (prodImg) {
            const imgX = contentX + contentW - IMG_COL_W;
            pdf.setLineWidth(0.1);
            pdf.line(imgX - 0.5, curY, imgX - 0.5, footerY - 0.3);
            const fit = fitImg(prodImg, IMG_COL_W - 1, midAvailH - 1);
            try {
              pdf.addImage(prodImg.data, 'PNG',
                imgX + (IMG_COL_W - fit.w) / 2,
                curY + (midAvailH - fit.h) / 2,
                fit.w, fit.h);
            } catch { /* skip */ }
          }

          // Product name — allow up to 2 lines with word wrap
          let textY = curY + PAD;
          const textLeftX = contentX + PAD;
          if (productName) {
            let nameFontSize = s(4.5);
            pdf.setFontSize(nameFontSize);
            pdf.setFont('helvetica', 'bold');
            let nameLines = pdf.splitTextToSize(productName.toUpperCase(), textW);
            // Auto-shrink if name is too long for 2 lines
            if (nameLines.length > 2) {
              nameFontSize = s(3.8);
              pdf.setFontSize(nameFontSize);
              nameLines = pdf.splitTextToSize(productName.toUpperCase(), textW);
            }
            nameLines = nameLines.slice(0, 2);
            const nameH = nameLines.length * nameFontSize * PT2MM * 1.3;
            pdf.text(nameLines, textLeftX, textY + nameFontSize * PT2MM, { lineHeightFactor: 1.3 });
            textY += nameH + 0.3;
          }

          // Description — fill remaining space, auto-shrink if needed
          if (desc) {
            const descAvail = footerY - textY - PAD;
            if (descAvail > 2) {
              let descFontSize = s(3.5);
              pdf.setFontSize(descFontSize);
              pdf.setFont('helvetica', 'bold');
              let descLines = pdf.splitTextToSize(desc.toUpperCase(), textW);
              const lineH = descFontSize * PT2MM * 1.3;
              const maxLines = Math.max(1, Math.floor(descAvail / lineH));
              // Auto-shrink if too many lines
              if (descLines.length > maxLines && descFontSize > s(2.8)) {
                descFontSize = s(2.8);
                pdf.setFontSize(descFontSize);
                descLines = pdf.splitTextToSize(desc.toUpperCase(), textW);
                const lineH2 = descFontSize * PT2MM * 1.3;
                const maxLines2 = Math.max(1, Math.floor(descAvail / lineH2));
                descLines = descLines.slice(0, maxLines2);
              } else {
                descLines = descLines.slice(0, maxLines);
              }
              pdf.text(descLines, textLeftX, textY + descFontSize * PT2MM, { lineHeightFactor: 1.3 });
            }
          }

          // ── FOOTER — 3 lines: Company/India, MfgDate/Email, Phone ──
          const footerTop = cy + CH - 6.5;
          pdf.setLineWidth(0.1);
          pdf.line(cx + STRIP_W, footerTop, cx + CW, footerTop);
          const ftX = contentX + 0.3; // inset from edges
          const ftW = contentW - 0.6;

          // Line 1: Company + Made in India
          pdf.setFontSize(s(3));
          pdf.setFont('helvetica', 'normal');
          pdf.text('Jaquar & Co. Pvt. Ltd.', ftX, footerTop + 1.7);
          pdf.text('Made in India', ftX + ftW, footerTop + 1.7, { align: 'right' });

          // Line 2: Mfg date + Email
          pdf.setFontSize(s(2.5));
          pdf.setTextColor(50, 50, 50);
          const mfgDate = label.mfgDate?.trim() || generateMfgDate();
          pdf.text(`Mth/Yr of Mfg: ${mfgDate}`, ftX, footerTop + 3.4);
          pdf.text('service@jaquar.com', ftX + ftW, footerTop + 3.4, { align: 'right' });

          // Line 3: Phone number
          pdf.text('Tel: 1800-102-9900', ftX + ftW, footerTop + 5, { align: 'right' });
          pdf.setTextColor(0, 0, 0);
        }
        } // end pageIdx loop
      }

      pdf.save('ganpati-labels.pdf');
      toast.success('PDF downloaded!', { id: tid });
    } catch (err) {
      toast.error(`PDF generation failed: ${err?.message || 'Unknown error'}. Try Ctrl+P → Save as PDF.`, { id: tid });
    } finally {
      setPdfLoading(false);
    }
  };

  const filledCount = labels.filter(l => l.product?.trim()).length;
  const totalPages = pages ? pages.length : 1;
  const totalFilled = pages ? pages.reduce((sum, p) => sum + p.filter(l => l.product?.trim()).length, 0) : filledCount;

  return (
    <div ref={containerRef} style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="depth-shadow" style={{
        background: 'linear-gradient(180deg, #1e293b, #1a2536)', borderRadius: 12, padding: '10px 14px',
        border: '1px solid #334155', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
        flexShrink: 0,
      }}>
        {/* Print copies input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ToolBtn onClick={handlePrint} variant="saffron" title="Ctrl+P">
            <Icon d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <Icon d="M6 14h12v8H6z" />
            Print
            <span style={{ fontSize: 10, opacity: 0.6 }}>Ctrl+P</span>
          </ToolBtn>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#0f172a', borderRadius: 8, padding: '4px 8px', border: '1px solid #334155' }}>
            <span style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap' }}>Copies</span>
            <button
              onClick={() => onCopiesChange && onCopiesChange(Math.max(1, copies - 1))}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 2px', fontSize: 14, lineHeight: 1 }}>−</button>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f97316', minWidth: 16, textAlign: 'center' }}>{copies}</span>
            <button
              onClick={() => onCopiesChange && onCopiesChange(Math.min(10, copies + 1))}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0 2px', fontSize: 14, lineHeight: 1 }}>+</button>
          </div>
        </div>

        {/* PDF */}
        <ToolBtn onClick={handleDownloadPDF} disabled={pdfLoading} variant="blue">
          {pdfLoading
            ? <span style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            : <Icon d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
          }
          PDF
        </ToolBtn>

        {/* PNG Export */}
        <ToolBtn onClick={async () => {
          const tid = toast.loading('Generating PNG…');
          try {
            const { default: html2canvas } = await dynamicImport(() => import('html2canvas'));
            const sheet = containerRef.current?.querySelector('.print-scale-wrapper');
            if (!sheet) throw new Error('Preview not found');
            const canvas = await html2canvas(sheet, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const link = document.createElement('a');
            link.download = `ganpati-labels-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('PNG downloaded!', { id: tid });
          } catch (err) { toast.error(`PNG failed: ${err?.message || 'Error'}`, { id: tid }); }
        }} variant="ghost">
          <Icon d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
          PNG
        </ToolBtn>

        {/* SVG Export */}
        <ToolBtn onClick={async () => {
          const tid = toast.loading('Generating SVG…');
          try {
            const { default: html2canvas } = await dynamicImport(() => import('html2canvas'));
            const sheet = containerRef.current?.querySelector('.print-scale-wrapper');
            if (!sheet) throw new Error('Preview not found');
            const canvas = await html2canvas(sheet, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const dataUrl = canvas.toDataURL('image/png');
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
              <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/>
            </svg>`;
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const link = document.createElement('a');
            link.download = `ganpati-labels-${Date.now()}.svg`;
            link.href = URL.createObjectURL(blob);
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 200);
            toast.success('SVG downloaded!', { id: tid });
          } catch (err) { toast.error(`SVG failed: ${err?.message || 'Error'}`, { id: tid }); }
        }} variant="ghost">
          <Icon d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
          SVG
        </ToolBtn>

        {/* Save / Load */}
        <ToolBtn onClick={onSave} variant="ghost">
          <Icon d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          Save
        </ToolBtn>
        <ToolBtn onClick={onLoad} variant="ghost">
          <Icon d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          Load
        </ToolBtn>

        {/* Calibrate toggle */}
        <ToolBtn
          onClick={() => setShowCalibration(o => !o)}
          variant={showCalibration ? 'green' : 'ghost'}
          style={{ marginLeft: 'auto' }}
        >
          <Icon d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          Calibrate
        </ToolBtn>

        {/* Stats */}
        <div style={{ padding: '4px 10px', borderRadius: 20, background: '#0f172a', border: '1px solid #334155', fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
          {totalFilled}/{totalPages * 12}{totalPages > 1 ? ` (${totalPages}pg)` : ''} &middot; <span style={{ color: '#f97316' }}>{Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* ── Calibration Panel ──────────────────────────────────────────── */}
      {showCalibration && (
        <div style={{
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: 12, padding: '14px 16px', flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>
            PRINT CALIBRATION
          </div>

          {/* Top margin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 12, color: '#64748b', minWidth: 130 }}>Top margin offset <span style={{ fontSize: 9, color: '#475569' }}>(− up, + down)</span></label>
            <input type="range" min="-5" max="5" step="0.5"
              value={printMargin} onChange={e => setPrintMargin(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#f97316' }} />
            <span style={{ fontSize: 12, color: '#f97316', minWidth: 44, textAlign: 'right' }}>
              {printMargin > 0 ? '+' : ''}{printMargin}mm
            </span>
            <ToolBtn onClick={() => setPrintMargin(0)} variant="ghost" style={{ fontSize: 10, padding: '4px 8px' }}>Reset</ToolBtn>
          </div>

          {/* Font scale */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 12, color: '#64748b', minWidth: 130 }}>Font size scale</label>
            <input type="range" min="0.6" max="1.5" step="0.05"
              value={fontScale} onChange={e => onFontScaleChange && onFontScaleChange(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#7c3aed' }} />
            <span style={{ fontSize: 12, color: '#7c3aed', minWidth: 44, textAlign: 'right' }}>
              {Math.round(fontScale * 100)}%
            </span>
            <ToolBtn onClick={() => onFontScaleChange && onFontScaleChange(1)} variant="ghost" style={{ fontSize: 10, padding: '4px 8px' }}>Reset</ToolBtn>
          </div>

          {/* ── Per-field Size & Bold sliders ── */}
          {fieldStyles && onFieldStylesChange && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginTop: 4 }}>
                PER-FIELD CONTROLS
              </div>
              {[
                { key: 'code',  label: 'Product Code',  color: '#38bdf8' },
                { key: 'name',  label: 'Product Name',  color: '#4ade80' },
                { key: 'desc',  label: 'Product Desc',  color: '#facc15' },
                { key: 'price', label: 'Product Price', color: '#fb923c' },
              ].map(({ key, label, color }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 0', borderTop: '1px solid #0f172a' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#64748b', minWidth: 36 }}>Size</span>
                    <input type="range" min="0.5" max="2" step="0.05"
                      value={fieldStyles[key]?.size ?? 1}
                      onChange={e => onFieldStylesChange(prev => ({ ...prev, [key]: { ...prev[key], size: Number(e.target.value) } }))}
                      style={{ flex: 1, accentColor: color }} />
                    <span style={{ fontSize: 11, color, minWidth: 36, textAlign: 'right' }}>
                      {Math.round((fieldStyles[key]?.size ?? 1) * 100)}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#64748b', minWidth: 36 }}>Bold</span>
                    <input type="range" min="0.5" max="1.5" step="0.05"
                      value={fieldStyles[key]?.bold ?? 1}
                      onChange={e => onFieldStylesChange(prev => ({ ...prev, [key]: { ...prev[key], bold: Number(e.target.value) } }))}
                      style={{ flex: 1, accentColor: color }} />
                    <span style={{ fontSize: 11, color, minWidth: 36, textAlign: 'right' }}>
                      {Math.round((fieldStyles[key]?.bold ?? 1) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
              <ToolBtn
                onClick={() => onFieldStylesChange({ code: { size: 1, bold: 1 }, name: { size: 1, bold: 1 }, desc: { size: 1, bold: 1 }, price: { size: 1, bold: 1 } })}
                variant="ghost" style={{ fontSize: 10, padding: '5px 10px', alignSelf: 'flex-start' }}
              >Reset all fields</ToolBtn>
            </>
          )}

          <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
            Adjust margin if labels print shifted. Font scale resizes all text. Per-field controls adjust individual sections.
          </p>
        </div>
      )}

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }} />
          <span style={{ fontSize: 11, color: '#475569' }}>Live A4 Preview &middot; 210×297mm &middot; {totalPages > 1 ? `${totalPages} pages · ` : ''}{totalFilled} labels</span>
        </div>
        {(copies > 1 || totalPages > 1) && (
          <span style={{ fontSize: 11, color: '#f97316', fontWeight: 600 }}>
            {totalPages * copies} sheet{totalPages * copies > 1 ? 's' : ''} on print
          </span>
        )}
      </div>

      {/* ── Scaled preview (screen only) ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingBottom: 16, overflow: 'hidden' }}>
        <div className="print-preview-frame card-3d" style={{
          width: A4_W * scale, height: A4_H * scale, flexShrink: 0, borderRadius: 6, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), 0 4px 16px rgba(249,115,22,0.08)',
        }}>
          <div className="print-scale-wrapper" style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: A4_W, height: A4_H }}>
            <LabelSheet labels={labels} extraTopMargin={printMargin} fontScale={fontScale} fieldStyles={fieldStyles} />
          </div>
        </div>
      </div>

      {/* ── Print Portal: renders directly under <body> for reliable Ctrl+P ── */}
      {createPortal(
        <div className="print-root" style={{ display: 'none' }}>
          {Array.from({ length: copies }, (_, copyIdx) =>
            (pages || [labels]).map((pageLabels, pageIdx) => (
              <LabelSheet key={`${copyIdx}-${pageIdx}`} labels={pageLabels} extraTopMargin={printMargin} fontScale={fontScale} fieldStyles={fieldStyles} />
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
