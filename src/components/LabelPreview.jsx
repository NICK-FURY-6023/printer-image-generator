import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
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
  onSave, onLoad, onPrint,
  copies = 1, onCopiesChange,
  fontScale = 1, onFontScaleChange,
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
      const { default: jsPDF }       = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const sheet = document.querySelector('.print-sheet');
      if (!sheet) throw new Error('Sheet not found');

      // Clone sheet into an off-screen full-size container so the
      // parent's preview transform (scale) doesn't shrink the capture.
      const offscreen = document.createElement('div');
      offscreen.style.cssText =
        'position:fixed;top:0;left:0;width:210mm;height:297mm;z-index:-9999;overflow:hidden;pointer-events:none;background:#fff;';
      const clone = sheet.cloneNode(true);
      clone.style.transform = 'none';

      // Sanitize clone: fix CSS that html2canvas can't render
      clone.querySelectorAll('*').forEach(el => {
        el.style.textDecoration = 'none';
        // Replace -webkit-line-clamp (html2canvas breaks text with it)
        if (el.style.display === '-webkit-box') {
          el.style.display = 'block';
          el.style.webkitLineClamp = 'unset';
          el.style.webkitBoxOrient = 'unset';
        }
      });

      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // Wait for all images inside the clone to finish loading
      const images = clone.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img =>
        new Promise(resolve => {
          if (img.complete) resolve();
          else { img.onload = img.onerror = resolve; }
        })
      ));

      const canvas = await html2canvas(clone, {
        scale: 3, useCORS: true, allowTaint: false,
        backgroundColor: '#ffffff',
        width: A4_W, height: A4_H,
        windowWidth: A4_W, windowHeight: A4_H,
      });

      document.body.removeChild(offscreen);

      const pdf = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });
      pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, 210, 297);
      pdf.save('ganpati-labels.pdf');
      toast.success('PDF downloaded!', { id: tid });
    } catch (err) {
      toast.error(`PDF generation failed: ${err?.message || 'Unknown error'}. Try Ctrl+P → Save as PDF.`, { id: tid });
    } finally {
      setPdfLoading(false);
    }
  };

  const filledCount = labels.filter(l => l.product?.trim()).length;

  return (
    <div ref={containerRef} style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16, gap: 12 }}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#1e293b', borderRadius: 12, padding: '10px 14px',
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
          {filledCount}/12 &middot; <span style={{ color: '#f97316' }}>{Math.round(scale * 100)}%</span>
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

          <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
            Adjust margin if labels print shifted up/down. Font scale resizes all label text.
          </p>
        </div>
      )}

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px #22c55e' }} />
          <span style={{ fontSize: 11, color: '#475569' }}>Live A4 Preview &middot; 210×297mm &middot; 12 labels</span>
        </div>
        {copies > 1 && (
          <span style={{ fontSize: 11, color: '#f97316', fontWeight: 600 }}>{copies} copies on print</span>
        )}
      </div>

      {/* ── Scaled preview (screen only) ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingBottom: 16, overflow: 'hidden' }}>
        <div className="print-preview-frame" style={{
          width: A4_W * scale, height: A4_H * scale, flexShrink: 0, borderRadius: 4, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        }}>
          <div className="print-scale-wrapper" style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: A4_W, height: A4_H }}>
            <LabelSheet labels={labels} extraTopMargin={printMargin} fontScale={fontScale} />
          </div>
        </div>
      </div>

      {/* ── Print Portal: renders directly under <body> for reliable Ctrl+P ── */}
      {createPortal(
        <div className="print-root" style={{ display: 'none' }}>
          <LabelSheet labels={labels} extraTopMargin={printMargin} fontScale={fontScale} />
          {Array.from({ length: Math.max(0, copies - 1) }, (_, i) => (
            <LabelSheet key={i} labels={labels} extraTopMargin={printMargin} fontScale={fontScale} />
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
