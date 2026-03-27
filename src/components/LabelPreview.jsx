import { useRef, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LabelSheet from './LabelSheet';

const A4_W = 794;
const A4_H = 1123;

export default function LabelPreview({ labels, onSave, onLoad }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.6);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [printMargin, setPrintMargin] = useState(0);
  const [showCalibration, setShowCalibration] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const w = el.clientWidth - 48;
      const h = el.clientHeight - 180;
      setScale(Math.min(w / A4_W, h / A4_H, 1));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    const tid = toast.loading('Generating PDF…');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const sheet = document.querySelector('.print-sheet');
      if (!sheet) throw new Error('Sheet not found');

      const canvas = await html2canvas(sheet, {
        scale: 4,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: A4_W,
        height: A4_H,
        windowWidth: A4_W,
        windowHeight: A4_H,
      });

      const pdf = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save('ganpati-labels.pdf');
      toast.success('PDF downloaded!', { id: tid });
    } catch {
      toast.error('PDF failed. Try Print → Save as PDF instead.', { id: tid });
    } finally {
      setPdfLoading(false);
    }
  };

  const filledCount = labels.filter(l => l.product?.trim()).length;

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px', gap: 12 }}
    >
      {/* Toolbar */}
      <div style={{
        background: '#1e293b', borderRadius: 12, padding: '12px 16px',
        border: '1px solid #334155', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
        flexShrink: 0,
      }}>
        <button onClick={handlePrint} className="btn-saffron" title="Ctrl+P">
          🖨️ Print <span style={{ opacity: 0.6, fontSize: 10 }}>Ctrl+P</span>
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={pdfLoading}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white',
            borderRadius: 8, fontWeight: 600, fontSize: 13, padding: '8px 16px',
            border: 'none', cursor: pdfLoading ? 'wait' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            opacity: pdfLoading ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          {pdfLoading ? <span className="animate-spin-slow">⏳</span> : '⬇️'} PDF
        </button>
        <button onClick={onSave} className="btn-ghost">💾 Save</button>
        <button onClick={onLoad} className="btn-ghost">📂 Load</button>
        <button
          onClick={() => setShowCalibration(o => !o)}
          className="btn-ghost"
          style={{ marginLeft: 'auto' }}
        >
          📏 Calibrate
        </button>
        <div style={{
          padding: '4px 10px', borderRadius: 20,
          background: '#0f172a', border: '1px solid #334155', fontSize: 11, color: '#64748b',
        }}>
          {filledCount}/12 · <span style={{ color: '#f97316' }}>{Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* Calibration panel */}
      {showCalibration && (
        <div className="animate-fade-in" style={{
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: 12, padding: '14px 16px', flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 12 }}>
            📏 PRINT CALIBRATION
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 12, color: '#64748b', minWidth: 110 }}>Top margin offset</label>
            <input
              type="range" min="-5" max="5" step="0.5"
              value={printMargin}
              onChange={e => setPrintMargin(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#f97316' }}
            />
            <span style={{ fontSize: 12, color: '#f97316', minWidth: 40, textAlign: 'right' }}>
              {printMargin > 0 ? '+' : ''}{printMargin}mm
            </span>
            <button onClick={() => setPrintMargin(0)} className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>
              Reset
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
            If printed labels are shifted up/down, adjust this and reprint.
          </p>
        </div>
      )}

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          <span style={{ fontSize: 11, color: '#475569' }}>Live A4 Preview · 210 × 297mm · 12 labels</span>
        </div>
        <span style={{ fontSize: 11, color: '#334155' }}>Print scale: 100%</span>
      </div>

      {/* Scaled sheet */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingBottom: 16, overflow: 'hidden' }}>
        <div style={{
          width: A4_W * scale, height: A4_H * scale, flexShrink: 0,
          borderRadius: 4, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: A4_W, height: A4_H }}>
            <LabelSheet labels={labels} extraTopMargin={printMargin} />
          </div>
        </div>
      </div>
    </div>
  );
}
