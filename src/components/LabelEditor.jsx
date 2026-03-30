import React, { useState, useRef, useEffect } from 'react';

const FIELDS = [
  { key: 'manufacturer', label: 'Brand Name',          placeholder: 'e.g. Jaquar',                          span: 2 },
  { key: 'logoUrl',      label: 'Brand Logo URL',      placeholder: 'Paste logo image URL',                 span: 2 },
  { key: 'code',         label: 'Product Code',        placeholder: 'e.g. FUS-CHR-29023B',                   span: 1, searchable: true },
  { key: 'price',        label: 'Product Price (₹)',   placeholder: 'e.g. 3800.00',                         span: 1 },
  { key: 'product',      label: 'Product Name',        placeholder: 'e.g. Concealed Body Diverter',         span: 2, searchable: true },
  { key: 'description',  label: 'Product Description', placeholder: 'e.g. High quality brass body diverter', span: 2 },
];

/* ── Jaquar Search helpers ── */
const SEARCH_API = '/api/jaquar-search';
const PRODUCT_API = '/api/jaquar-product';

async function searchJaquar(query) {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(`${SEARCH_API}?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function fetchJaquarProduct(url) {
  try {
    const res = await fetch(`${PRODUCT_API}?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Search Dropdown Component ── */
function JaquarSearchDropdown({ results, loading, onSelect, visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
      background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
      maxHeight: 220, overflowY: 'auto', marginTop: 4,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      {loading && (
        <div style={{ padding: '10px 12px', fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="jq-spinner" /> Jaquar se search ho raha hai...
        </div>
      )}
      {!loading && results.length === 0 && (
        <div style={{ padding: '10px 12px', fontSize: 11, color: '#475569' }}>
          Koi product nahi mila
        </div>
      )}
      {results.map((p, i) => (
        <button key={p.id || i} onClick={() => onSelect(p)} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '8px 12px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
          borderBottom: '1px solid #334155',
        }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          {p.image && (
            <img src={p.image} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4, background: '#fff', flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', letterSpacing: '0.02em' }}>{p.code}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {p.name}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

const emptyLabel = () => ({
  product: '', code: '', price: '', manufacturer: '', logoUrl: '', description: '',
});
const isFilled   = (l) => !!(l.product?.trim() || l.code?.trim() || l.price?.trim());

function Icon({ d, size = 13, sw = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

function LabelCard({ index, label, onChange, onDuplicateToAll, onReset, isActive, onActivate }) {
  const [open, setOpen] = useState(index === 0);
  const cardRef = useRef(null);
  const filled = isFilled(label);

  // Jaquar search state
  const [searchField, setSearchField] = useState(null); // which field is being searched
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const dropdownRef = useRef(null);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    searchJaquar(debouncedQuery).then(results => {
      if (!cancelled) {
        setSearchResults(results);
        setSearchLoading(false);
        setShowDropdown(true);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchableChange = (key, value) => {
    onChange(key, value);
    setSearchField(key);
    setSearchQuery(value);
    if (value.length >= 3) setSearchLoading(true);
    else setShowDropdown(false);
  };

  const handleProductSelect = async (product) => {
    setShowDropdown(false);
    setSearchQuery('');
    // Fill basic fields immediately
    onChange('code', product.code || '');
    onChange('product', product.name || '');

    // Fetch full details for description
    if (product.url) {
      const detail = await fetchJaquarProduct(product.url);
      if (detail) {
        if (detail.description) onChange('description', detail.description);
      }
    }
  };

  useEffect(() => {
    if (isActive && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setOpen(true);
    }
  }, [isActive]);

  return (
    <div ref={cardRef} className={`label-card${isActive ? ' active' : ''} animate-fade-in`}>
      <button
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: isActive ? 'rgba(249,115,22,0.08)' : '#1e293b',
          border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s',
        }}
        onClick={() => { setOpen(o => !o); onActivate(index); }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: filled
              ? 'linear-gradient(135deg,#22c55e,#16a34a)'
              : (isActive ? 'linear-gradient(135deg,#f97316,#ea580c)' : '#334155'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'white',
          }}>
            {index + 1}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: label.product?.trim() ? '#f1f5f9' : '#475569' }}>
              {label.product?.trim() || 'Empty label'}
            </div>
            {label.price?.trim() && (
              <div style={{ fontSize: 11, color: '#f97316', marginTop: 1 }}>₹{label.price}</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {filled && (
            <span style={{ fontSize: 10, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 6px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Icon d="M20 6 9 17l-5-5" size={10} sw={2.5} /> filled
            </span>
          )}
          <span style={{ color: '#475569', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: 14, background: '#0f172a', borderTop: '1px solid #1e293b' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {FIELDS.map(({ key, label: fl, placeholder, span, section, searchable }) => (
              <React.Fragment key={key}>
                {section && (
                  <div style={{
                    gridColumn: '1 / -1', fontSize: 10, fontWeight: 700,
                    color: '#f97316', letterSpacing: '0.08em', textTransform: 'uppercase',
                    paddingTop: 8, borderTop: '1px solid #334155', marginTop: 2,
                  }}>{section}</div>
                )}
                <div style={{ gridColumn: span === 2 ? '1 / -1' : undefined, position: 'relative' }} ref={searchable ? dropdownRef : undefined}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4, letterSpacing: '0.05em' }}>
                    {fl}
                    {searchable && <span style={{ color: '#f97316', fontSize: 9, marginLeft: 4 }}>🔍 Jaquar</span>}
                  </label>
                  <input
                    type="text"
                    value={label[key] || ''}
                    onChange={e => searchable ? handleSearchableChange(key, e.target.value) : onChange(key, e.target.value)}
                    onFocus={() => { if (searchable && searchResults.length > 0) setShowDropdown(true); }}
                    placeholder={placeholder}
                    className="input-dark"
                    style={{ fontSize: 12, padding: '7px 10px' }}
                  />
                  {searchable && searchField === key && (
                    <JaquarSearchDropdown
                      results={searchResults}
                      loading={searchLoading}
                      visible={showDropdown}
                      onSelect={handleProductSelect}
                    />
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={() => onDuplicateToAll(label)}
              style={{
                flex: 1, padding: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
                color: '#fb923c', borderRadius: 7, transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(249,115,22,0.2)'}
              onMouseOut={e  => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'}
            >
              <Icon d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1M8 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 0h2a2 2 0 0 1 2 2v3m2 4H10m0 0 3-3m-3 3 3 3" />
              Copy to All 12
            </button>
            <button
              onClick={() => onReset(index)}
              style={{
                padding: '7px 12px', fontSize: 11, cursor: 'pointer',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171', borderRadius: 7, transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
              onMouseOut={e  => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            >
              <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LabelEditor({ labels, setLabels }) {
  const [activeIndex, setActiveIndex]       = useState(0);
  const [applyAll, setApplyAll]             = useState(emptyLabel());
  const [applyPanelOpen, setApplyPanelOpen] = useState(false);

  const updateLabel    = (index, key, value) => setLabels(labels.map((l, i) => i === index ? { ...l, [key]: value } : l));
  const resetLabel     = (index)             => setLabels(labels.map((l, i) => i === index ? emptyLabel() : l));
  const duplicateToAll = (src)               => setLabels(labels.map(() => ({ ...src })));

  const handleApplyAll = () => {
    setLabels(labels.map(l => {
      const merged = { ...l };
      Object.entries(applyAll).forEach(([k, v]) => { if (v.trim()) merged[k] = v; });
      return merged;
    }));
  };

  const filledCount = labels.filter(isFilled).length;

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', letterSpacing: '0.05em', margin: 0 }}>LABEL EDITOR</h2>
          <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>{filledCount} of 12 labels filled</p>
        </div>
        <button
          onClick={() => setApplyPanelOpen(o => !o)}
          className="btn-ghost"
          style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Bulk Fill
        </button>
      </div>

      {/* Dot Navigator */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: '12px 14px', border: '1px solid #334155' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.08em', marginBottom: 10 }}>
          JUMP TO LABEL
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {labels.map((l, i) => (
            <button
              key={i}
              className={`label-dot${i === activeIndex ? ' active' : ''}${isFilled(l) ? ' filled' : ''}`}
              onClick={() => setActiveIndex(i)}
              title={l.product?.trim() || `Label ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 10, color: '#475569' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} /> Active
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Filled
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#334155', display: 'inline-block' }} /> Empty
          </span>
        </div>
      </div>

      {/* Bulk Apply Panel */}
      {applyPanelOpen && (
        <div className="animate-fade-in" style={{
          background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 12, padding: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            APPLY TO ALL LABELS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {FIELDS.map(({ key, label, placeholder, span, section }) => (
              <React.Fragment key={key}>
                {section && (
                  <div style={{
                    gridColumn: '1 / -1', fontSize: 10, fontWeight: 700,
                    color: '#f97316', letterSpacing: '0.08em', textTransform: 'uppercase',
                    paddingTop: 8, borderTop: '1px solid rgba(249,115,22,0.2)', marginTop: 2,
                  }}>{section}</div>
                )}
                <div style={{ gridColumn: span === 2 ? '1 / -1' : undefined }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>{label}</label>
                  <input
                    type="text"
                    value={applyAll[key]}
                    onChange={e => setApplyAll(a => ({ ...a, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="input-dark"
                    style={{ fontSize: 12, padding: '7px 10px', borderColor: 'rgba(249,115,22,0.25)' }}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>
          <button onClick={handleApplyAll} className="btn-saffron" style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Apply Filled Fields to All 12 Labels
          </button>
        </div>
      )}

      {/* Label Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {labels.map((label, i) => (
          <LabelCard
            key={i}
            index={i}
            label={label}
            isActive={activeIndex === i}
            onActivate={setActiveIndex}
            onChange={(key, value) => updateLabel(i, key, value)}
            onDuplicateToAll={duplicateToAll}
            onReset={resetLabel}
          />
        ))}
      </div>
    </div>
  );
}
