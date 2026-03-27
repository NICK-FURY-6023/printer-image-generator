import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../services/api';

export default function TemplateManager({ mode, labels, onLoad, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || '';
      if (msg.includes('table not found') || msg.includes('does not exist')) {
        toast.error('Templates table not found. Run setup SQL in Supabase Dashboard.');
      } else {
        toast.error('Could not load templates. Check Supabase config.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const existing = templates.find(t => t.name === name);
      if (existing) {
        await updateTemplate(existing.id, name, labels);
        toast.success(`Updated "${name}"`);
      } else {
        await createTemplate(name, labels);
        toast.success(`Saved "${name}"`);
      }
      await loadTemplates();
      setNewName('');
    } catch {
      toast.error('Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      await deleteTemplate(id);
      setTemplates(ts => ts.filter(t => t.id !== id));
      toast('Template deleted', { icon: '🗑️' });
    } catch {
      toast.error('Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', padding: 16,
    }}>
      <div className="animate-fade-in" style={{
        background: '#1e293b', border: '1px solid #334155', borderRadius: 16,
        width: '100%', maxWidth: 440, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
      }}>
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid #334155',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              {mode === 'save' ? '💾 Save Template' : '📂 Load Template'}
            </h2>
            <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
              {templates.length} template{templates.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#334155', border: 'none', color: '#94a3b8',
              width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
              fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#475569'}
            onMouseOut={e => e.currentTarget.style.background = '#334155'}
          >×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {mode === 'save' && (
            <div style={{
              background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: 10, padding: '14px', marginBottom: 20,
            }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#f97316', letterSpacing: '0.08em', marginBottom: 8 }}>
                TEMPLATE NAME
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text" value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder="e.g. Festival Sale Labels"
                  className="input-dark"
                  style={{ flex: 1, borderColor: 'rgba(249,115,22,0.3)' }}
                  autoFocus
                />
                <button onClick={handleSave} disabled={saving || !newName.trim()} className="btn-saffron" style={{ flexShrink: 0 }}>
                  {saving ? '…' : 'Save'}
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>Existing name → overwrite. New name → create.</p>
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.08em', marginBottom: 10 }}>
            {mode === 'load' ? 'SAVED TEMPLATES' : 'EXISTING TEMPLATES'}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569' }}>
              <div className="animate-spin-slow" style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 13 }}>Loading…</div>
            </div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#334155' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗂️</div>
              <div style={{ fontSize: 13 }}>No templates saved yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {templates.map(t => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', background: '#0f172a',
                    border: '1px solid #334155', borderRadius: 10, transition: 'border-color 0.15s',
                    cursor: mode === 'load' ? 'pointer' : 'default',
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#f97316'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#334155'}
                  onClick={mode === 'load' ? () => onLoad(t) : undefined}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📄 {t.name}
                    </div>
                    {t.created_at && (
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
                        {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 10 }}>
                    {mode === 'load' && (
                      <button onClick={e => { e.stopPropagation(); onLoad(t); }} className="btn-saffron" style={{ padding: '6px 12px', fontSize: 11 }}>
                        Load
                      </button>
                    )}
                    {mode === 'save' && (
                      <button onClick={() => setNewName(t.name)} className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }}>
                        Use name
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(t.id, t.name); }}
                      disabled={deletingId === t.id}
                      style={{
                        background: 'none', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#f87171', borderRadius: 7, padding: '5px 9px', cursor: 'pointer',
                        fontSize: 12, transition: 'all 0.15s', opacity: deletingId === t.id ? 0.5 : 1,
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid #334155' }}>
          <button onClick={onClose} className="btn-ghost" style={{ width: '100%', textAlign: 'center', padding: '9px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
