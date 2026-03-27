import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import LabelEditor from './LabelEditor';
import LabelPreview from './LabelPreview';
import TemplateManager from './TemplateManager';

const emptyLabel = () => ({ product: '', code: '', price: '', size: '', qty: '', manufacturer: '' });
const initialLabels = () => Array.from({ length: 12 }, emptyLabel);
const DRAFT_KEY = 'ganpati_draft';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [labels, setLabels] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Always ensure exactly 12
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
  const autoSaveTimer = useRef(null);

  // Auto-save draft to localStorage
  useEffect(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(labels));
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 1200);
    return () => clearTimeout(autoSaveTimer.current);
  }, [labels]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setTemplateManagerMode('save');
        setShowTemplateManager(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const openSave = () => { setTemplateManagerMode('save'); setShowTemplateManager(true); };
  const openLoad = () => { setTemplateManagerMode('load'); setShowTemplateManager(true); };

  const handleTemplateLoad = (template) => {
    // Handle both snake_case (Supabase) and camelCase
    const raw = template.label_data || template.labelData;
    const arr = Array.isArray(raw) ? raw : (raw?.labels ?? []);
    const padded = Array.from({ length: 12 }, (_, i) => ({ ...emptyLabel(), ...(arr[i] || {}) }));
    setLabels(padded);
    setCurrentTemplateName(template.name);
    setShowTemplateManager(false);
    toast.success(`Loaded "${template.name}"`);
  };

  const handleReset = () => {
    if (!confirm('Reset all labels?')) return;
    setLabels(initialLabels());
    setCurrentTemplateName('');
    localStorage.removeItem(DRAFT_KEY);
    toast('Labels cleared', { icon: '🗑️' });
  };

  const filledCount = labels.filter(l => l.product?.trim()).length;

  return (
    <div className="min-h-screen flex flex-col no-print" style={{ background: '#0f172a', color: '#f1f5f9' }}>
      {/* ─── Navbar ─── */}
      <nav style={{
        background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 50%, #9a3412 100%)',
        boxShadow: '0 4px 20px rgba(234,88,12,0.4)',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🪔</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Shree Ganpati Agency</div>
              <div style={{ fontSize: 10, opacity: 0.75, letterSpacing: '0.1em' }}>LABEL PRINT SYSTEM v2</div>
            </div>
            {currentTemplateName && (
              <div style={{
                marginLeft: 12, padding: '3px 10px',
                background: 'rgba(255,255,255,0.15)', borderRadius: 20,
                fontSize: 11, fontWeight: 600,
              }}>
                📄 {currentTemplateName}
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Auto-save indicator */}
            <div style={{
              fontSize: 11, opacity: autoSaved ? 1 : 0, transition: 'opacity 0.3s',
              color: '#fde68a', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              ✓ Draft saved
            </div>
            {/* Label count badge */}
            <div style={{
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(255,255,255,0.15)',
              fontSize: 11, fontWeight: 600,
            }}>
              {filledCount}/12 labels
            </div>
            <button onClick={openSave} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
              borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s',
            }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              💾 Save <span style={{ opacity: 0.6, fontSize: 10 }}>Ctrl+S</span>
            </button>
            <button onClick={openLoad} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
              borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s',
            }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              📂 Load
            </button>
            <button onClick={handleReset} style={{
              background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5',
              borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.35)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
            >
              🗑 Reset
            </button>
            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.2)' }} />
            <button onClick={() => { logout(); toast('Logged out'); navigate('/'); }} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.7)',
              borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer',
            }}>
              ⏏ Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Main split ─── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', maxWidth: 1600, width: '100%', margin: '0 auto' }}>
        {/* Left: Editor (42%) */}
        <div style={{
          width: '42%', overflowY: 'auto', flexShrink: 0,
          borderRight: '1px solid #1e293b',
          background: '#0f172a',
        }}>
          <LabelEditor labels={labels} setLabels={setLabels} />
        </div>

        {/* Right: Preview (58%) */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#111827' }}>
          <LabelPreview labels={labels} onSave={openSave} onLoad={openLoad} />
        </div>
      </div>

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <TemplateManager
          mode={templateManagerMode}
          labels={labels}
          onLoad={handleTemplateLoad}
          onClose={() => setShowTemplateManager(false)}
        />
      )}
    </div>
  );
}
