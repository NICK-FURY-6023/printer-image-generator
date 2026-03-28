import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import LabelEditor from './LabelEditor';
import LabelPreview from './LabelPreview';
import TemplateManager from './TemplateManager';

const emptyLabel = () => ({
  product: '', code: '', price: '', manufacturer: '',
});
const initialLabels = () => Array.from({ length: 12 }, emptyLabel);
const DRAFT_KEY   = 'ganpati_draft';
const HISTORY_KEY = 'ganpati_history';

const CSV_COLUMNS = ['manufacturer', 'code', 'product', 'price'];
const SAMPLE_CSV = `manufacturer,code,product,price
Jaquar & Co. Pvt. Ltd.,ALD-CHR-070N,Concealed Body Diverter,3800.00
Jaquar & Co. Pvt. Ltd.,FLR-CHR-005B,Single Lever Basin Mixer,2200.00
Cera Sanitaryware Ltd.,OPL-CHR-015,Wall Mixer With Bend,1800.00
Hindware Ltd.,SPA-CHR-620,Overhead Shower 200mm,4500.00
Parryware Industries,PRY-CHR-035,Angular Stop Cock,980.00
Kohler Co.,KOH-CHR-450,High Flow Diverter,5600.00
Jaquar & Co. Pvt. Ltd.,JGR-CHR-110,Pillar Cock Tall Body,1450.00
Essco Bathware,ESS-CHR-055,Flush Valve 32mm,650.00
Grohe India Pvt. Ltd.,GRH-CHR-820,Kitchen Sink Mixer,3200.00
Geberit India Pvt. Ltd.,GBT-CHR-042,Concealed Cistern,2800.00
Jaquar & Co. Pvt. Ltd.,JGR-CHR-085,Health Faucet Set,780.00
Towel Rack 600mm,BAT-CHR-320,1200.00,600mm,1N,Bathline India Pvt. Ltd.,334455667,9BAT7K8,May 2025,INDIA,"Sector 63 Noida","Bhiwadi Rajasthan",hello@bathline.in,1800-200-8899`;

function Btn({ onClick, disabled, children, style = {}, variant = 'ghost' }) {
  const base = {
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 8, fontSize: 12, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
    ...style,
  };
  const variants = {
    ghost:  { background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.08)' },
    danger: { background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' },
    blue:   { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white' },
    green:  { background: 'rgba(34,197,94,0.12)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' },
  };
  return (
    <button onClick={!disabled ? onClick : undefined}
      style={{ ...base, ...variants[variant] }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.opacity = '0.85'; }}
      onMouseOut={e => { if (!disabled) e.currentTarget.style.opacity = '1'; }}>
      {children}
    </button>
  );
}

function Icon({ d, size = 13, sw = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* ── CSV Import Modal ─────────────────────────────────────────────── */
function CSVImportModal({ onImport, onClose }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const parseCSV = (raw) => {
    const lines = raw.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return { error: 'CSV must have a header row and at least 1 data row.' };
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const missing = CSV_COLUMNS.filter(c => !header.includes(c));
    if (missing.length) return { error: `Missing columns: ${missing.join(', ')}` };

    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = {};
      header.forEach((h, i) => { if (CSV_COLUMNS.includes(h)) obj[h] = vals[i] || ''; });
      return { ...emptyLabel(), ...obj };
    });
    return { rows: rows.slice(0, 12) };
  };

  const handleText = (val) => {
    setText(val);
    setError('');
    if (!val.trim()) { setPreview([]); return; }
    const result = parseCSV(val);
    if (result.error) { setError(result.error); setPreview([]); }
    else setPreview(result.rows);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setError('File too large (max 1MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => handleText(ev.target.result);
    reader.readAsText(file);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'ganpati-labels-sample.csv'; a.click();
  };

  const handleImport = () => {
    if (!preview.length) return;
    const padded = Array.from({ length: 12 }, (_, i) => preview[i] || emptyLabel());
    onImport(padded);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Import from CSV</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Upload a CSV file or paste CSV text to fill all 12 labels at once</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: 'none' }} />
          <Btn onClick={() => fileRef.current.click()} variant="ghost">
            <Icon d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4m0 0L8 8m4-4v12" />
            Upload CSV
          </Btn>
          <Btn onClick={downloadSample} variant="green">
            <Icon d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
            Download Sample CSV
          </Btn>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, letterSpacing: '0.06em' }}>
            OR PASTE CSV TEXT
          </label>
          <textarea
            value={text}
            onChange={e => handleText(e.target.value)}
            placeholder={`product,code,price,size,qty,manufacturer\nBasmati Rice,GR-001,120,1kg,10pcs,Ganpati Foods`}
            rows={5}
            style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#fca5a5', marginBottom: 14 }}>
            {error}
          </div>
        )}

        {preview.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#22c55e', marginBottom: 8 }}>
              Preview — {preview.length} labels found
            </div>
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #334155', overflow: 'hidden' }}>
              {preview.slice(0, 5).map((r, i) => (
                <div key={i} style={{ padding: '8px 14px', borderBottom: i < Math.min(4, preview.length - 1) ? '1px solid #1e293b' : 'none', fontSize: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#f97316', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600, flex: 1 }}>{r.product || '—'}</span>
                  <span style={{ color: '#f97316' }}>{r.price ? `₹${r.price}` : ''}</span>
                  <span style={{ color: '#64748b' }}>{r.code}</span>
                </div>
              ))}
              {preview.length > 5 && <div style={{ padding: '8px 14px', fontSize: 11, color: '#475569' }}>...and {preview.length - 5} more</div>}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn onClick={onClose} variant="ghost">Cancel</Btn>
          <Btn onClick={handleImport} disabled={!preview.length} variant="blue">
            <Icon d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4m0 0L8 8m4-4v12" />
            Import {preview.length > 0 ? `${preview.length} Labels` : ''}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/* ── Print History Modal ──────────────────────────────────────────── */
function HistoryModal({ onClose, onRestore }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      setHistory(h);
    } catch { setHistory([]); }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    toast.success('History cleared');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Print History</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Last 30 print / save operations</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {history.length > 0 && <Btn onClick={clearHistory} variant="danger" style={{ fontSize: 11, padding: '5px 10px' }}>Clear</Btn>}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {history.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#334155' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>
                <Icon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" size={40} />
              </div>
              <div style={{ fontSize: 14, color: '#475569' }}>No print history yet</div>
              <div style={{ fontSize: 12, color: '#334155', marginTop: 6 }}>History is saved when you print or save a template</div>
            </div>
          ) : (
            history.map((h, i) => (
              <div key={i} style={{ padding: '14px 24px', borderBottom: i < history.length - 1 ? '1px solid #0f172a' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: h.action === 'print' ? 'rgba(249,115,22,0.12)' : 'rgba(37,99,235,0.12)', border: `1px solid ${h.action === 'print' ? 'rgba(249,115,22,0.25)' : 'rgba(37,99,235,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: h.action === 'print' ? '#f97316' : '#60a5fa' }}>
                  <Icon d={h.action === 'print' ? 'M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.75 19.817m.463-5.988a42.453 42.453 0 0 1 10.559 0m0 0L17.25 19.817M12 3v10.5' : 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>
                    {h.templateName || 'Untitled'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {h.filledCount}/12 labels · {h.copies > 1 ? `${h.copies} copies · ` : ''}{new Date(h.time).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {h.labels && (
                  <Btn onClick={() => { onRestore(h.labels, h.templateName); onClose(); }} variant="ghost" style={{ fontSize: 11, padding: '5px 10px', flexShrink: 0 }}>
                    Restore
                  </Btn>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Log to history ───────────────────────────────────────────────── */
function logHistory(action, templateName, filledCount, labels, copies = 1) {
  try {
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const entry = { id: Date.now(), action, templateName, filledCount, copies, time: new Date().toISOString(), labels: JSON.parse(JSON.stringify(labels)) };
    const updated = [entry, ...existing].slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

/* ── Dashboard ────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [labels, setLabels] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return Array.from({ length: 12 }, (_, i) => parsed[i] || emptyLabel());
        }
      }
    } catch { /* ignore */ }
    return initialLabels();
  });

  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [templateManagerMode, setTemplateManagerMode] = useState('load');
  const [currentTemplateName, setCurrentTemplateName] = useState('');
  const [autoSaved, setAutoSaved] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copies, setCopies] = useState(1);
  const [fontScale, setFontScale] = useState(1);
  const autoSaveTimer = useRef(null);

  // Auto-save draft
  const autoFadeTimer = useRef(null);
  useEffect(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(labels)); } catch { /* quota exceeded */ }
      setAutoSaved(true);
      clearTimeout(autoFadeTimer.current);
      autoFadeTimer.current = setTimeout(() => setAutoSaved(false), 2000);
    }, 1200);
    return () => {
      clearTimeout(autoSaveTimer.current);
      clearTimeout(autoFadeTimer.current);
    };
  }, [labels]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault(); handlePrint();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); openSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [labels, copies, currentTemplateName]);

  const openSave = () => { setTemplateManagerMode('save'); setShowTemplateManager(true); };
  const openLoad = () => { setTemplateManagerMode('load'); setShowTemplateManager(true); };

  const handlePrint = () => {
    const filledCount = labels.filter(l => l.product?.trim()).length;
    logHistory('print', currentTemplateName || 'Untitled', filledCount, labels, copies);
    window.print();
  };

  const handleTemplateLoad = (template) => {
    const raw = template.label_data || template.labelData;
    const arr = Array.isArray(raw) ? raw : (raw?.labels ?? []);
    const padded = Array.from({ length: 12 }, (_, i) => ({ ...emptyLabel(), ...(arr[i] || {}) }));
    setLabels(padded);
    setCurrentTemplateName(template.name);
    setShowTemplateManager(false);
    logHistory('load', template.name, padded.filter(l => l.product?.trim()).length, padded);
    toast.success(`Loaded "${template.name}"`);
  };

  const handleReset = () => {
    if (!confirm('Reset all labels?')) return;
    setLabels(initialLabels());
    setCurrentTemplateName('');
    localStorage.removeItem(DRAFT_KEY);
    toast('Labels cleared');
  };

  const handleCSVImport = (newLabels) => {
    setLabels(newLabels);
    setCurrentTemplateName('');
    setShowCSVImport(false);
    toast.success(`Imported ${newLabels.filter(l => l.product?.trim()).length} labels from CSV`);
  };

  const handleJSONExport = () => {
    const data = { labels, templateName: currentTemplateName || 'Untitled', exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `ganpati-labels-${Date.now()}.json`; a.click();
    toast.success('JSON exported');
  };

  const jsonInputRef = useRef(null);

  const handleJSONImport = () => {
    if (!jsonInputRef.current) {
      jsonInputRef.current = document.createElement('input');
      jsonInputRef.current.type = 'file';
      jsonInputRef.current.accept = '.json';
    }
    jsonInputRef.current.value = '';
    jsonInputRef.current.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 1024 * 1024) { toast.error('File too large (max 1MB)'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          const arr = Array.isArray(data) ? data : (data.labels || []);
          if (!arr.length) { toast.error('Invalid JSON format'); return; }
          const padded = Array.from({ length: 12 }, (_, i) => ({ ...emptyLabel(), ...(arr[i] || {}) }));
          setLabels(padded);
          if (data.templateName) setCurrentTemplateName(data.templateName);
          toast.success(`Imported ${padded.filter(l => l.product?.trim()).length} labels`);
        } catch { toast.error('Invalid JSON file'); }
      };
      reader.readAsText(file);
    };
    jsonInputRef.current.click();
  };

  const filledCount = labels.filter(l => l.product?.trim()).length;

  return (
    <div className="min-h-screen flex flex-col no-print" style={{ background: '#0f172a', color: '#f1f5f9' }}>
      {/* ─── Navbar ─── */}
      <nav style={{ background: 'linear-gradient(135deg,#ea580c 0%,#c2410c 50%,#9a3412 100%)', boxShadow: '0 4px 20px rgba(234,88,12,0.4)', flexShrink: 0, position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Shree Ganpati Agency</div>
              <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: '0.1em' }}>LABEL PRINT SYSTEM v2</div>
            </div>
            {currentTemplateName && (
              <div style={{ marginLeft: 8, padding: '3px 10px', background: 'rgba(255,255,255,0.15)', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                {currentTemplateName}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11, opacity: autoSaved ? 1 : 0, transition: 'opacity 0.3s', color: '#fde68a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon d="M20 6 9 17l-5-5" sw={2.5} />
              Saved
            </div>
            <div style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', fontSize: 11, fontWeight: 600 }}>
              {filledCount}/12
            </div>

            <Btn onClick={() => setShowCSVImport(true)} variant="ghost">
              <Icon d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l5 5v11a2 2 0 0 1-2 2z" />
              CSV
            </Btn>
            <Btn onClick={handleJSONExport} variant="ghost">
              <Icon d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
              Export
            </Btn>
            <Btn onClick={handleJSONImport} variant="ghost">
              <Icon d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4m0 0L8 8m4-4v12" />
              Import
            </Btn>
            <Btn onClick={openSave} variant="ghost">
              <Icon d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              Save
            </Btn>
            <Btn onClick={openLoad} variant="ghost">
              <Icon d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              Load
            </Btn>
            <Btn onClick={() => setShowHistory(true)} variant="ghost">
              <Icon d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              History
            </Btn>
            <Btn onClick={handleReset} variant="danger">
              <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              Reset
            </Btn>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
            <Btn onClick={() => { logout(); toast('Logged out'); navigate('/', { replace: true }); }} variant="ghost" style={{ padding: '7px 10px' }}>
              <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              Logout
            </Btn>
          </div>
        </div>
      </nav>

      {/* ─── Main split ─── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', maxWidth: 1600, width: '100%', margin: '0 auto' }}>
        <div style={{ width: '42%', overflowY: 'auto', flexShrink: 0, borderRight: '1px solid #1e293b', background: '#0f172a' }}>
          <LabelEditor labels={labels} setLabels={setLabels} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', background: '#111827' }}>
          <LabelPreview
            labels={labels}
            onSave={openSave}
            onLoad={openLoad}
            copies={copies}
            onCopiesChange={setCopies}
            fontScale={fontScale}
            onFontScaleChange={setFontScale}
            onPrint={handlePrint}
          />
        </div>
      </div>

      {showTemplateManager && (
        <TemplateManager mode={templateManagerMode} labels={labels} onLoad={handleTemplateLoad} onClose={() => setShowTemplateManager(false)} />
      )}
      {showCSVImport && <CSVImportModal onImport={handleCSVImport} onClose={() => setShowCSVImport(false)} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} onRestore={(l, n) => { setLabels(l); setCurrentTemplateName(n || ''); toast.success('Labels restored from history'); }} />}
    </div>
  );
}
