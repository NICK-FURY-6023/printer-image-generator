import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import LabelEditor from './LabelEditor';
import LabelPreview from './LabelPreview';
import TemplateManager from './TemplateManager';

const emptyLabel = () => ({
  product: '', code: '', price: '', manufacturer: '', logoUrl: '', description: '',
});
const initialLabels = () => Array.from({ length: 12 }, emptyLabel);
const DRAFT_KEY   = 'ganpati_draft';
const HISTORY_KEY = 'ganpati_history';

const CSV_COLUMNS = ['manufacturer', 'logoUrl', 'code', 'product', 'description', 'price'];
const SAMPLE_CSV = `manufacturer,logoUrl,code,product,description,price
Jaquar,/jaquar-logo.png,ALD-CHR-070N,Concealed Body Diverter,High quality brass concealed body for single lever high flow diverter,3800.00
Jaquar,/jaquar-logo.png,FLR-CHR-005B,Single Lever Basin Mixer,Chrome plated single lever basin mixer with hot & cold,2200.00
Cera,,OPL-CHR-015,Wall Mixer With Bend,Premium wall mixer with provision for overhead shower,1800.00
Hindware,,SPA-CHR-620,Overhead Shower 200mm,Round overhead shower with rain spray pattern,4500.00
Parryware,,PRY-CHR-035,Angular Stop Cock,Brass angular stop cock with ceramic cartridge,980.00
Kohler,,KOH-CHR-450,High Flow Diverter,High flow concealed diverter with trim,5600.00
Jaquar,/jaquar-logo.png,JGR-CHR-110,Pillar Cock Tall Body,Tall body pillar cock for table top basins,1450.00
Essco,,ESS-CHR-055,Flush Valve 32mm,32mm flush valve for western toilets,650.00
Grohe,,GRH-CHR-820,Kitchen Sink Mixer,Single lever kitchen sink mixer with pull-out spray,3200.00
Geberit,,GBT-CHR-042,Concealed Cistern,Concealed cistern for wall hung toilets,2800.00
Jaquar,/jaquar-logo.png,JGR-CHR-085,Health Faucet Set,Complete health faucet set with hose and holder,780.00`;

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

    // Parse a CSV line respecting quoted fields
    const parseLine = (line) => {
      const vals = [];
      let cur = '', inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { vals.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      vals.push(cur.trim());
      return vals;
    };

    const rows = lines.slice(1).map(line => {
      const vals = parseLine(line);
      const obj = {};
      header.forEach((h, i) => { if (CSV_COLUMNS.includes(h)) obj[h] = vals[i] || ''; });
      return { ...emptyLabel(), ...obj };
    });
    return { rows: rows.slice(0, 12), totalRows: rows.length };
  };

  const handleText = (val) => {
    setText(val);
    setError('');
    if (!val.trim()) { setPreview([]); return; }
    const result = parseCSV(val);
    if (result.error) { setError(result.error); setPreview([]); }
    else {
      setPreview(result.rows);
      if (result.totalRows > 12) setError(`Note: Only first 12 of ${result.totalRows} labels imported.`);
    }
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'ganpati-labels-sample.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 200);
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
            placeholder={`manufacturer,logoUrl,code,product,description,price\nJaquar,,ALD-CHR-070N,Concealed Body Diverter,High quality brass body,3800.00`}
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
    if (!confirm('Delete all history? This cannot be undone.')) return;
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
    toast.success('History cleared');
  };

  const deleteEntry = (idx) => {
    if (!confirm('Delete this history entry?')) return;
    const updated = history.filter((_, i) => i !== idx);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    toast.success('Entry deleted');
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const fmtTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
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
            {history.length > 0 && <Btn onClick={clearHistory} variant="danger" style={{ fontSize: 11, padding: '5px 10px' }}>Clear All</Btn>}
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
              <div key={h.id || i} style={{ padding: '14px 24px', borderBottom: i < history.length - 1 ? '1px solid #0f172a' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: h.action === 'print' ? 'rgba(249,115,22,0.12)' : 'rgba(37,99,235,0.12)', border: `1px solid ${h.action === 'print' ? 'rgba(249,115,22,0.25)' : 'rgba(37,99,235,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: h.action === 'print' ? '#f97316' : '#60a5fa' }}>
                  <Icon d={h.action === 'print' ? 'M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.75 19.817m.463-5.988a42.453 42.453 0 0 1 10.559 0m0 0L17.25 19.817M12 3v10.5' : 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'} size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 3 }}>
                    {h.templateName || h.autoName || 'Untitled'}
                    <span style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8', marginLeft: 8, textTransform: 'capitalize' }}>{h.action}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>
                    {h.filledCount}/{(h.pageCount || 1) * 12} labels{h.pageCount > 1 ? ` · ${h.pageCount} pages` : ''}{h.copies > 1 ? ` · ${h.copies} copies` : ''}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📅 {fmtDate(h.time)}</span>
                    <span>🕐 {fmtTime(h.time)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {(h.labels || h.pages) && (
                    <Btn onClick={() => { onRestore(h.pages || [h.labels], h.templateName); onClose(); }} variant="ghost" style={{ fontSize: 11, padding: '5px 10px' }}>
                      Restore
                    </Btn>
                  )}
                  <button
                    onClick={() => deleteEntry(i)}
                    title="Delete this entry"
                    style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', padding: '4px 8px', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Icon d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V3.5A1.5 1.5 0 0 1 9.5 2h5A1.5 1.5 0 0 1 16 3.5V7" size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Auto-generate history name from label content ────────────────── */
function generateAutoName(pages) {
  const allLabels = pages.flat();
  const filled = allLabels.filter(l => l.product?.trim() || l.code?.trim());
  if (!filled.length) return 'Empty';
  const brands = [...new Set(filled.map(l => l.manufacturer?.trim()).filter(Boolean))];
  const firstCode = filled[0].code?.trim() || '';
  let name = '';
  if (brands.length === 1) {
    name = brands[0];
    if (firstCode) name += ` ${firstCode}`;
  } else if (firstCode) {
    name = firstCode;
  } else {
    name = filled[0].product?.trim()?.slice(0, 30) || 'Labels';
  }
  if (filled.length > 1) name += ` +${filled.length - 1}`;
  if (pages.length > 1) name += ` (${pages.length}pg)`;
  return name;
}

/* ── Log to history ───────────────────────────────────────────────── */
function logHistory(action, templateName, filledCount, pages, copies = 1) {
  try {
    const autoName = generateAutoName(pages);
    const displayName = templateName || autoName;
    const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const entry = {
      id: Date.now(), action, templateName: displayName, autoName, filledCount, copies,
      pageCount: pages.length,
      time: new Date().toISOString(),
      pages: JSON.parse(JSON.stringify(pages)),
      // Keep backward compat: labels = first page
      labels: JSON.parse(JSON.stringify(pages[0] || [])),
    };
    const updated = [entry, ...existing].slice(0, 30);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

/* ── Keyboard Shortcuts Modal ──────────────────────────────────────── */
function ShortcutsModal({ onClose }) {
  const shortcuts = [
    { keys: 'Ctrl + P', desc: 'Print labels' },
    { keys: 'Ctrl + S', desc: 'Save template' },
    { keys: 'Ctrl + Z', desc: 'Undo last change' },
    { keys: 'Ctrl + Shift + Z', desc: 'Redo last undo' },
    { keys: '?', desc: 'Toggle keyboard shortcuts' },
    { keys: '1–9', desc: 'Jump to label 1–9 (when not in input)' },
    { keys: 'Ctrl + ←/→', desc: 'Switch pages' },
  ];
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, width: '100%', maxWidth: 420, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>⌨️ Keyboard Shortcuts</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {shortcuts.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < shortcuts.length - 1 ? '1px solid #0f172a' : 'none' }}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{s.desc}</span>
              <kbd style={{
                background: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '3px 10px',
                fontSize: 12, fontWeight: 600, color: '#f97316', fontFamily: 'monospace', whiteSpace: 'nowrap',
              }}>{s.keys}</kbd>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#475569', marginTop: 16, marginBottom: 0 }}>
          Press <kbd style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 4, padding: '1px 6px', fontSize: 11, color: '#f97316' }}>?</kbd> anywhere to toggle this panel
        </p>
      </div>
    </div>
  );
}

/* ── Label Templates Gallery ──────────────────────────────────────── */
const PRESET_TEMPLATES = [
  {
    name: 'Jaquar Bathroom Fittings',
    labels: [
      { manufacturer: 'Jaquar', logoUrl: '/jaquar-logo.png', code: 'ALD-CHR-079N', product: 'Alive Single Lever Basin Mixer', description: 'Chrome plated single lever basin mixer with hot & cold', price: '4450.00' },
      { manufacturer: 'Jaquar', logoUrl: '/jaquar-logo.png', code: 'FLR-CHR-005B', product: 'Florentine Single Lever Basin Mixer', description: 'Basin mixer with 450mm braided hoses', price: '2870.00' },
      { manufacturer: 'Jaquar', logoUrl: '/jaquar-logo.png', code: 'OPL-CHR-015N', product: 'Opal Prime Wall Mixer', description: 'Wall mixer with provision for overhead shower', price: '3120.00' },
      { manufacturer: 'Jaquar', logoUrl: '/jaquar-logo.png', code: 'LYR-CHR-038N', product: 'Lyric Pillar Cock', description: 'Chrome plated pillar cock for wash basin', price: '1580.00' },
    ],
  },
  {
    name: 'Mixed Brands Premium',
    labels: [
      { manufacturer: 'Kohler', logoUrl: '', code: 'KOH-CHR-450', product: 'High Flow Diverter', description: 'High flow concealed diverter with trim', price: '5600.00' },
      { manufacturer: 'Grohe', logoUrl: '', code: 'GRH-CHR-820', product: 'Kitchen Sink Mixer', description: 'Single lever kitchen sink mixer with pull-out spray', price: '3200.00' },
      { manufacturer: 'Hindware', logoUrl: '', code: 'HND-CHR-210', product: 'Overhead Shower 200mm', description: 'Round overhead shower with rain spray', price: '4500.00' },
      { manufacturer: 'Cera', logoUrl: '', code: 'CRA-CHR-112', product: 'Angular Stop Cock', description: 'Brass angular stop cock with ceramic cartridge', price: '980.00' },
    ],
  },
  {
    name: 'Jaquar Health Faucets',
    labels: [
      { manufacturer: 'Jaquar', logoUrl: '/jaquar-logo.png', code: 'ALD-CHR-589', product: 'Alive Health Faucet', description: 'Health faucet with 1m PVC hose and hook', price: '990.00' },
      { manufacturer: 'Jaquar', logoUrl: '/jaquar-logo.png', code: 'CON-CHR-589', product: 'Continental Health Faucet', description: 'Health faucet set with wall hook', price: '750.00' },
    ],
  },
  {
    name: 'Empty 12 Labels',
    labels: [],
  },
];

function TemplatesGallery({ onApply, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>📋 Label Templates</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Quick-start with pre-filled label data</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PRESET_TEMPLATES.map((t, i) => (
            <div key={i} style={{
              background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 16, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#f97316'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; }}
              onClick={() => { onApply(t); onClose(); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{t.name}</span>
                <span style={{ fontSize: 11, color: '#64748b', background: '#1e293b', padding: '2px 8px', borderRadius: 10 }}>
                  {t.labels.length || 0} labels
                </span>
              </div>
              {t.labels.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {t.labels.slice(0, 4).map((l, j) => (
                    <span key={j} style={{ fontSize: 10, color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace' }}>
                      {l.code}
                    </span>
                  ))}
                  {t.labels.length > 4 && <span style={{ fontSize: 10, color: '#475569' }}>+{t.labels.length - 4} more</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();

  // ── Mobile responsive ──
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileTab, setMobileTab] = useState('editor');
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Multi-page state ──
  const [pages, setPages] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // New format: { pages: [[...], [...]] }
        if (parsed.pages && Array.isArray(parsed.pages) && parsed.pages.length) {
          return parsed.pages.map(page =>
            Array.from({ length: 12 }, (_, i) => ({ ...emptyLabel(), ...(page[i] || {}) }))
          );
        }
        // Old format: flat array of 12
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [Array.from({ length: 12 }, (_, i) => ({ ...emptyLabel(), ...(parsed[i] || {}) }))];
        }
      }
    } catch { /* ignore */ }
    return [initialLabels()];
  });
  const [currentPage, setCurrentPage] = useState(0);

  // Current page's labels (derived)
  const labels = pages[currentPage] || initialLabels();
  // Bug #2 fix: use functional setPages to avoid stale currentPage
  const setLabels = useCallback((newLabelsOrFn) => {
    pushUndo(pages);
    setPages(prev => {
      const updated = [...prev];
      const page = Math.min(currentPage, prev.length - 1);
      if (page < 0 || page >= prev.length) return prev;
      updated[page] = typeof newLabelsOrFn === 'function' ? newLabelsOrFn(prev[page]) : newLabelsOrFn;
      return updated;
    });
  }, [currentPage, pages, pushUndo]);

  // Bug #1 fix: use functional update to avoid stale pages.length
  const addPage = useCallback(() => {
    setPages(prev => {
      const updated = [...prev, initialLabels()];
      setCurrentPage(updated.length - 1);
      toast.success(`Page ${updated.length} added`);
      return updated;
    });
  }, []);

  // Bug #1 fix: move currentPage update inside setPages callback
  const removePage = useCallback((idx) => {
    setPages(prev => {
      if (prev.length <= 1) { toast.error('Cannot remove the last page'); return prev; }
      if (!confirm(`Remove page ${idx + 1}? All labels on this page will be lost.`)) return prev;
      const updated = prev.filter((_, i) => i !== idx);
      setCurrentPage(cp => {
        if (cp >= updated.length) return Math.max(0, updated.length - 1);
        if (cp > idx) return cp - 1;
        return cp;
      });
      toast.success(`Page ${idx + 1} removed`);
      return updated;
    });
  }, []);

  const duplicatePage = useCallback((idx) => {
    setPages(prev => {
      const copy = JSON.parse(JSON.stringify(prev[idx]));
      const updated = [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
      setCurrentPage(idx + 1);
      toast.success(`Page ${idx + 1} duplicated`);
      return updated;
    });
  }, []);

  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [templateManagerMode, setTemplateManagerMode] = useState('load');
  const [currentTemplateName, setCurrentTemplateName] = useState('');
  const [autoSaved, setAutoSaved] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTemplatesGallery, setShowTemplatesGallery] = useState(false);
  const [copies, setCopies] = useState(1);
  const [fontScale, setFontScale] = useState(1);
  const autoSaveTimer = useRef(null);

  // ── Undo / Redo ──
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const skipHistory = useRef(false);

  const pushUndo = useCallback((prevPages) => {
    if (skipHistory.current) return;
    undoStack.current = [...undoStack.current.slice(-29), JSON.stringify(prevPages)];
    redoStack.current = [];
  }, []);

  const handleUndo = useCallback(() => {
    if (!undoStack.current.length) { toast('Nothing to undo', { icon: '↩️' }); return; }
    const prev = undoStack.current.pop();
    redoStack.current.push(JSON.stringify(pages));
    skipHistory.current = true;
    setPages(JSON.parse(prev));
    skipHistory.current = false;
    toast('Undo', { icon: '↩️', duration: 1000 });
  }, [pages]);

  const handleRedo = useCallback(() => {
    if (!redoStack.current.length) { toast('Nothing to redo', { icon: '↪️' }); return; }
    const next = redoStack.current.pop();
    undoStack.current.push(JSON.stringify(pages));
    skipHistory.current = true;
    setPages(JSON.parse(next));
    skipHistory.current = false;
    toast('Redo', { icon: '↪️', duration: 1000 });
  }, [pages]);

  // Auto-save draft (debounced on change + periodic every 30s)
  const autoFadeTimer = useRef(null);
  const periodicSaveTimer = useRef(null);
  const saveDraft = useCallback(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ pages })); }
    catch (err) {
      if (err.name === 'QuotaExceededError') toast.error('Storage full — draft not saved!');
    }
    setAutoSaved(true);
    clearTimeout(autoFadeTimer.current);
    autoFadeTimer.current = setTimeout(() => setAutoSaved(false), 2000);
  }, [pages]);

  useEffect(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(saveDraft, 1200);
    return () => {
      clearTimeout(autoSaveTimer.current);
      clearTimeout(autoFadeTimer.current);
    };
  }, [pages, saveDraft]);

  // Periodic auto-save every 30s
  useEffect(() => {
    periodicSaveTimer.current = setInterval(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ pages })); } catch {}
    }, 30000);
    return () => clearInterval(periodicSaveTimer.current);
  }, [pages]);

  // These must be defined before the keyboard handler useEffect that references them
  const openSave = useCallback(() => { setTemplateManagerMode('save'); setShowTemplateManager(true); }, []);
  const openLoad = useCallback(() => { setTemplateManagerMode('load'); setShowTemplateManager(true); }, []);

  const handlePrint = useCallback(() => {
    const totalFilled = pages.reduce((sum, p) => sum + p.filter(l => l.product?.trim()).length, 0);
    if (!totalFilled) { toast.error('No labels filled — nothing to print!'); return; }
    logHistory('print', currentTemplateName, totalFilled, pages, copies);
    window.print();
  }, [pages, currentTemplateName, copies]);

  // Bug #8 fix: useRef pattern — single stable listener, no dep churn
  const actionsRef = useRef({ handlePrint: null, openSave: null, handleUndo: null, handleRedo: null });
  useEffect(() => { actionsRef.current = { handlePrint, openSave, handleUndo, handleRedo }; });
  const stateRef = useRef({ pages, copies, currentTemplateName, currentPage });
  useEffect(() => { stateRef.current = { pages, copies, currentTemplateName, currentPage }; });
  useEffect(() => {
    const handler = (e) => {
      const s = stateRef.current;
      const a = actionsRef.current;
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault(); a.handlePrint();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); a.openSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault(); a.handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault(); a.handleRedo();
      }
      if (e.key === '?' && !inInput) {
        setShowShortcuts(o => !o);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft' && !inInput) {
        e.preventDefault();
        setCurrentPage(p => Math.max(0, p - 1));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight' && !inInput) {
        e.preventDefault();
        setCurrentPage(p => Math.min(s.pages.length - 1, p + 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);


  const handleTemplateLoad = (template) => {
    const raw = template.label_data || template.labelData;
    let loadedPages;
    // New format: { pages: [[...], [...]] }
    if (raw && raw.pages && Array.isArray(raw.pages)) {
      loadedPages = raw.pages.map(page =>
        Array.from({ length: 12 }, (_, i) => ({ ...emptyLabel(), ...(page[i] || {}) }))
      );
    } else {
      // Old format: flat array
      const arr = Array.isArray(raw) ? raw : (raw?.labels ?? []);
      loadedPages = [Array.from({ length: 12 }, (_, i) => ({ ...emptyLabel(), ...(arr[i] || {}) }))];
    }
    setPages(loadedPages);
    setCurrentPage(0);
    setCurrentTemplateName(template.name);
    setShowTemplateManager(false);
    const totalFilled = loadedPages.reduce((sum, p) => sum + p.filter(l => l.product?.trim()).length, 0);
    logHistory('load', template.name, totalFilled, loadedPages);
    toast.success(`Loaded "${template.name}"`);
  };

  const handleReset = useCallback(() => {
    if (!confirm('Reset all pages and labels?')) return;
    setPages([initialLabels()]);
    setCurrentPage(0);
    setCurrentTemplateName('');
    localStorage.removeItem(DRAFT_KEY);
    toast('Labels cleared');
  }, []);

  const handleCSVImport = useCallback((newLabels) => {
    setLabels(newLabels);
    setCurrentTemplateName('');
    setShowCSVImport(false);
    toast.success(`Imported ${newLabels.filter(l => l.product?.trim()).length} labels to page ${currentPage + 1}`);
  }, [setLabels, currentPage]);

  const handleTemplateApply = useCallback((template) => {
    pushUndo(pages);
    const newLabels = Array.from({ length: 12 }, (_, i) => ({
      ...emptyLabel(),
      ...(template.labels[i] || {}),
    }));
    setLabels(newLabels);
    setCurrentTemplateName(template.name);
    toast.success(`Applied "${template.name}"`);
  }, [pushUndo, pages, setLabels]);

  const handleJSONExport = useCallback(() => {
    const data = { pages, templateName: currentTemplateName || 'Untitled', exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `ganpati-labels-${Date.now()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 200);
    toast.success('JSON exported');
  }, [pages, currentTemplateName]);

  const handleCSVExport = useCallback(() => {
    const allLabels = pages.flat();
    const header = 'manufacturer,logoUrl,code,product,description,price,productUrl';
    const rows = allLabels.map(l =>
      [l.manufacturer, l.logoUrl, l.code, l.product, l.description, l.price, l.productUrl]
        .map(v => `"${(v || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `ganpati-labels-${Date.now()}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 200);
    toast.success('CSV exported');
  }, [pages]);

  const jsonInputRef = useRef(null);

  // Bug #19/#20 fix: validate label objects on import
  const isValidLabel = (l) => typeof l === 'object' && l !== null && !Array.isArray(l);

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
          let loadedPages;
          if (data.pages && Array.isArray(data.pages)) {
            loadedPages = data.pages.map(page => {
              if (!Array.isArray(page)) return initialLabels();
              return Array.from({ length: 12 }, (_, i) => {
                const item = page[i];
                return { ...emptyLabel(), ...(isValidLabel(item) ? item : {}) };
              });
            });
          } else {
            const arr = Array.isArray(data) ? data : (data.labels || []);
            if (!arr.length) { toast.error('Invalid JSON format'); return; }
            loadedPages = [Array.from({ length: 12 }, (_, i) => {
              const item = arr[i];
              return { ...emptyLabel(), ...(isValidLabel(item) ? item : {}) };
            })];
          }
          if (!loadedPages.length) { toast.error('No valid pages found'); return; }
          setPages(loadedPages);
          setCurrentPage(0);
          if (data.templateName) setCurrentTemplateName(data.templateName);
          const totalFilled = loadedPages.reduce((sum, p) => sum + p.filter(l => l.product?.trim()).length, 0);
          toast.success(`Imported ${totalFilled} labels (${loadedPages.length} page${loadedPages.length > 1 ? 's' : ''})`);
        } catch { toast.error('Invalid JSON file'); }
      };
      reader.readAsText(file);
    };
    jsonInputRef.current.click();
  };

  const filledCount = labels.filter(l => l.product?.trim()).length;
  const totalFilled = pages.reduce((sum, p) => sum + p.filter(l => l.product?.trim()).length, 0);

  return (
    <div className="min-h-screen flex flex-col no-print" style={{ background: '#0f172a', color: '#f1f5f9' }}>
      {/* ─── Navbar ─── */}
      <nav style={{ background: 'linear-gradient(135deg,#ea580c 0%,#c2410c 50%,#9a3412 100%)', boxShadow: '0 4px 20px rgba(234,88,12,0.4), 0 8px 32px rgba(0,0,0,0.3)', flexShrink: 0, position: 'relative', zIndex: 10 }}>
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
              <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: '0.1em' }}>LABEL PRINT SYSTEM v3</div>
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
              {totalFilled}/{pages.length * 12}
              {pages.length > 1 && <span style={{ opacity: 0.7, marginLeft: 4 }}>({pages.length}pg)</span>}
            </div>

            <Btn onClick={() => setShowCSVImport(true)} variant="ghost">
              <Icon d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l5 5v11a2 2 0 0 1-2 2z" />
              CSV
            </Btn>
            <Btn onClick={handleJSONExport} variant="ghost">
              <Icon d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
              JSON
            </Btn>
            <Btn onClick={handleCSVExport} variant="ghost">
              <Icon d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4m0 0-4-4m4 4V4" />
              CSV
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
            <Btn onClick={() => setShowTemplatesGallery(true)} variant="ghost">
              <Icon d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zM4 13a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6zM16 13a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-6z" />
              Templates
            </Btn>
            <Btn onClick={handleUndo} variant="ghost" style={{ padding: '7px 8px' }} title="Undo (Ctrl+Z)">
              <Icon d="M3 10h10a5 5 0 0 1 0 10H9M3 10l4-4M3 10l4 4" />
            </Btn>
            <Btn onClick={handleRedo} variant="ghost" style={{ padding: '7px 8px' }} title="Redo (Ctrl+Shift+Z)">
              <Icon d="M21 10H11a5 5 0 0 0 0 10h4M21 10l-4-4M21 10l-4 4" />
            </Btn>
            <Btn onClick={handleReset} variant="danger">
              <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              Reset
            </Btn>
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
            <Btn onClick={toggleTheme} variant="ghost" style={{ padding: '7px 8px' }} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark'
                ? <Icon d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
                : <Icon d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              }
            </Btn>
            <Btn onClick={() => setShowShortcuts(true)} variant="ghost" style={{ padding: '7px 8px' }} title="Keyboard shortcuts (?)">
              <Icon d="M15.2 3H8.8C5.96 3 5 3.96 5 6.8v10.4C5 20.04 5.96 21 8.8 21h6.4c2.84 0 3.8-.96 3.8-3.8V6.8C19 3.96 18.04 3 15.2 3zM11 7.5h2M8 11h8M8 14.5h8" />
            </Btn>
            <Btn onClick={() => { logout(); toast('Logged out'); navigate('/', { replace: true }); }} variant="ghost" style={{ padding: '7px 10px' }}>
              <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              Logout
            </Btn>
          </div>
        </div>
      </nav>

      {/* ─── Page Navigator ─── */}
      <div className="depth-shadow" style={{
        background: 'linear-gradient(180deg, #1e293b, #172032)', borderBottom: '1px solid #334155', flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
        maxWidth: 1600, width: '100%', margin: '0 auto',
      }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.05em', marginRight: 4 }}>PAGES</span>
        {pages.map((page, i) => {
          const pFilled = page.filter(l => l.product?.trim()).length;
          const isActive = i === currentPage;
          return (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              onContextMenu={(e) => { e.preventDefault(); if (pages.length > 1) removePage(i); }}
              title={`Page ${i + 1} — ${pFilled}/12 filled${pages.length > 1 ? ' (right-click to remove)' : ''}`}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: isActive ? '1px solid #f97316' : '1px solid #334155',
                background: isActive ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                color: isActive ? '#f97316' : '#94a3b8',
                transition: 'all 0.15s', position: 'relative',
              }}
            >
              {i + 1}
              {pFilled > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 14, height: 14, borderRadius: '50%', fontSize: 8, fontWeight: 700,
                  background: pFilled === 12 ? '#22c55e' : '#f97316', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {pFilled}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={addPage}
          title="Add new page"
          style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            border: '1px dashed #334155', background: 'transparent', color: '#64748b',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#64748b'; }}
        >
          + Page
        </button>
        {pages.length > 1 && (
          <>
            <div style={{ width: 1, height: 18, background: '#334155', margin: '0 4px' }} />
            <button
              onClick={() => duplicatePage(currentPage)}
              title={`Duplicate page ${currentPage + 1}`}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: '1px solid #334155', background: 'transparent', color: '#64748b',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
              }}
              onMouseOver={e => { e.currentTarget.style.color = '#60a5fa'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#64748b'; }}
            >
              <Icon d="M8 7v8a2 2 0 0 0 2 2h6M8 7V5a2 2 0 0 1 2-2h4.586a1 1 0 0 1 .707.293l4.414 4.414a1 1 0 0 1 .293.707V15a2 2 0 0 1-2 2h-2M8 7H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" size={12} />
              Duplicate
            </button>
            <button
              onClick={() => removePage(currentPage)}
              title={`Remove page ${currentPage + 1}`}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#64748b',
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
              }}
              onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#64748b'; }}
            >
              <Icon d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V3.5A1.5 1.5 0 0 1 9.5 2h5A1.5 1.5 0 0 1 16 3.5V7" size={12} />
              Remove
            </button>
          </>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#475569' }}>
          Page {currentPage + 1} of {pages.length} &middot; {filledCount}/12 on this page
        </span>
      </div>

      {/* ─── Mobile Tab Bar ─── */}
      {isMobile && (
        <div style={{
          display: 'flex', flexShrink: 0, borderBottom: '1px solid #334155', background: '#1e293b',
        }}>
          {['editor', 'preview'].map(tab => (
            <button key={tab} onClick={() => setMobileTab(tab)} style={{
              flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: 'none', borderBottom: mobileTab === tab ? '2px solid #f97316' : '2px solid transparent',
              background: mobileTab === tab ? 'rgba(249,115,22,0.08)' : 'transparent',
              color: mobileTab === tab ? '#f97316' : '#64748b',
              transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {tab === 'editor' ? '✏️ Editor' : '👁️ Preview'}
            </button>
          ))}
        </div>
      )}

      {/* ─── Main split ─── */}
      <div className="panel-3d" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, overflow: 'hidden', maxWidth: 1600, width: '100%', margin: '0 auto' }}>
        <div style={{
          width: isMobile ? '100%' : '42%', overflowY: 'auto', flexShrink: 0,
          borderRight: isMobile ? 'none' : '1px solid #1e293b', background: 'linear-gradient(180deg, #0f172a, #0c1322)',
          display: isMobile && mobileTab !== 'editor' ? 'none' : 'block',
        }}>
          <LabelEditor labels={labels} setLabels={setLabels} />
        </div>
        <div style={{
          flex: 1, overflowY: 'auto', background: 'linear-gradient(180deg, #111827, #0d1421)',
          display: isMobile && mobileTab !== 'preview' ? 'none' : 'block',
        }}>
          <LabelPreview
            labels={labels}
            pages={pages}
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
        <TemplateManager mode={templateManagerMode} labels={{ pages }} onLoad={handleTemplateLoad} onClose={() => setShowTemplateManager(false)} />
      )}
      {showCSVImport && <CSVImportModal onImport={handleCSVImport} onClose={() => setShowCSVImport(false)} />}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} onRestore={(restoredPages, n) => {
        const loadedPages = restoredPages.map(page =>
          Array.from({ length: 12 }, (_, i) => ({ ...emptyLabel(), ...(page[i] || {}) }))
        );
        setPages(loadedPages);
        setCurrentPage(0);
        setCurrentTemplateName(n || '');
        toast.success(`Restored ${loadedPages.length} page${loadedPages.length > 1 ? 's' : ''} from history`);
      }} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {showTemplatesGallery && <TemplatesGallery onApply={handleTemplateApply} onClose={() => setShowTemplatesGallery(false)} />}
    </div>
  );
}
