import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

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
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.6);
  const [pdfLoading, setPdfLoading] = useState(false);

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
      const { toCanvas } = await dynamicImport(() => import('html-to-image'));

      const pdf = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait', compress: true });

      // Use the print portal sheets — they render pixel-perfect labels
      const printRoot = document.querySelector('.print-root');
      if (!printRoot) throw new Error('Print root not found');

      // Make print-root visible on-screen so browser can compute styles
      const origDisplay = printRoot.style.display;
      printRoot.style.display = 'block';
      printRoot.style.position = 'absolute';
      printRoot.style.left = '0';
      printRoot.style.top = '0';
      printRoot.style.width = '210mm';
      printRoot.style.zIndex = '-1';
      printRoot.style.opacity = '0';
      printRoot.style.pointerEvents = 'none';

      // Wait for all images inside print-root to finish loading
      const imgs = printRoot.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(img =>
        img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
      ));
      // Let browser paint elements fully
      await new Promise(r => setTimeout(r, 200));

      const sheets = printRoot.querySelectorAll('.print-sheet');
      if (!sheets.length) throw new Error('No label sheets found');

      let isFirstPage = true;
      for (const sheet of sheets) {
        if (!isFirstPage) pdf.addPage();
        isFirstPage = false;

        // html-to-image uses browser's own rendering engine (SVG foreignObject)
        // — supports CSS Grid, flexbox, all properties natively
        const canvas = await toCanvas(sheet, {
          pixelRatio: 3,
          backgroundColor: '#ffffff',
          cacheBust: true,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      // Restore print-root to hidden
      printRoot.style.display = origDisplay;
      printRoot.style.position = '';
      printRoot.style.left = '';
      printRoot.style.top = '';
      printRoot.style.width = '';
      printRoot.style.zIndex = '';
      printRoot.style.opacity = '';
      printRoot.style.pointerEvents = '';

      pdf.save('ganpati-labels.pdf');
      toast.success('PDF downloaded!', { id: tid });
    } catch (err) {
      // Restore print-root on error
      const pr = document.querySelector('.print-root');
      if (pr) {
        pr.style.display = 'none';
        pr.style.position = '';
        pr.style.left = '';
        pr.style.top = '';
        pr.style.width = '';
        pr.style.zIndex = '';
        pr.style.opacity = '';
        pr.style.pointerEvents = '';
      }
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
            const { toPng } = await dynamicImport(() => import('html-to-image'));
            const sheet = containerRef.current?.querySelector('.print-scale-wrapper');
            if (!sheet) throw new Error('Preview not found');
            const dataUrl = await toPng(sheet, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
            const link = document.createElement('a');
            link.download = `ganpati-labels-${Date.now()}.png`;
            link.href = dataUrl;
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
            const { toSvg } = await dynamicImport(() => import('html-to-image'));
            const sheet = containerRef.current?.querySelector('.print-scale-wrapper');
            if (!sheet) throw new Error('Preview not found');
            const dataUrl = await toSvg(sheet, { backgroundColor: '#ffffff', cacheBust: true });
            const svgText = decodeURIComponent(dataUrl.split(',')[1]);
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
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

        {/* Stats */}
        <div style={{ padding: '4px 10px', borderRadius: 20, background: '#0f172a', border: '1px solid #334155', fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
          {totalFilled}/{totalPages * 12}{totalPages > 1 ? ` (${totalPages}pg)` : ''} &middot; <span style={{ color: '#f97316' }}>{Math.round(scale * 100)}%</span>
        </div>
      </div>

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
            <LabelSheet labels={labels} />
          </div>
        </div>
      </div>

      {/* ── Print Portal: renders directly under <body> for reliable Ctrl+P ── */}
      {createPortal(
        <div className="print-root" style={{ display: 'none' }}>
          {Array.from({ length: copies }, (_, copyIdx) =>
            (pages || [labels]).map((pageLabels, pageIdx) => (
              <LabelSheet key={`${copyIdx}-${pageIdx}`} labels={pageLabels} />
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
