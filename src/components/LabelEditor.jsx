import React, { useState, useRef, useEffect } from 'react';

const FIELDS = [
  { key: 'manufacturer', label: 'Brand Name',          placeholder: 'e.g. Jaquar',                          span: 2 },
  { key: 'logoUrl',      label: 'Brand Logo URL',      placeholder: 'Paste logo image URL',                 span: 2 },
  { key: 'code',         label: 'Model / Product Code', placeholder: 'e.g. ALD-CHR-079N',                   span: 1, searchable: true },
  { key: 'price',        label: 'MRP (₹ Per Piece)',   placeholder: 'e.g. 3,800.00',                        span: 1 },
  { key: 'size',         label: 'Size',                placeholder: 'e.g. 15mm (1/2")',                      span: 1 },
  { key: 'qty',          label: 'Qty',                 placeholder: 'e.g. 1',                                span: 1 },
  { key: 'product',      label: 'Product Name',        placeholder: 'e.g. Concealed Body Diverter',         span: 2, searchable: true },
  { key: 'description',  label: 'Product Description', placeholder: 'e.g. CONCEALED BODY FOR SINGLE LEVER HIGH FLOW DIVERTER...', span: 2 },
];

/* ── Jaquar Search helpers ── */
const PRODUCT_API = '/api/jaquar-product';
const SEARCH_API = '/api/jaquar-search';
const LIVE_SEARCH_THRESHOLD = 3; // trigger live search when local results < this

// Product database — lazy-loaded on first search, not at module level
let _productDB = null;
let _productDBPromise = null;
let _productDBReady = false;

function loadProductDB() {
  if (_productDB) return Promise.resolve(_productDB);
  if (_productDBPromise) return _productDBPromise;
  _productDBPromise = fetch('/jaquar-products.json')
    .then(r => r.ok ? r.json() : [])
    .then(data => { _productDB = data; _productDBReady = true; return data; })
    .catch(() => {
      // Bug #5 fix: allow retry on failure instead of caching empty forever
      _productDB = null;
      _productDBPromise = null;
      _productDBReady = false;
      return [];
    });
  return _productDBPromise;
}

// Instant client-side search against preloaded DB
function searchLocal(query, db) {
  if (!query || query.length < 2 || !db || !db.length) return [];
  const q = query.toUpperCase().replace(/[-\s]/g, '');
  const results = [];
  for (const p of db) {
    const code = (p.code || '').toUpperCase().replace(/[-\s]/g, '');
    const name = (p.name || '').toUpperCase();
    if (code.includes(q) || name.includes(q)) {
      results.push(p);
      if (results.length >= 30) break;
    }
  }
  // Sort: exact code prefix first
  results.sort((a, b) => {
    const ac = (a.code || '').toUpperCase().replace(/[-\s]/g, '');
    const bc = (b.code || '').toUpperCase().replace(/[-\s]/g, '');
    const aStart = ac.startsWith(q) ? 0 : 1;
    const bStart = bc.startsWith(q) ? 0 : 1;
    return aStart - bStart;
  });
  return results;
}

// Live search from jaquar.com via backend API
async function fetchLiveSearch(query) {
  try {
    const res = await fetch(`${SEARCH_API}?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(p => ({ ...p, _live: true })) : [];
  } catch { return []; }
}

// Merge live results into local results, deduplicating by code
function mergeResults(localResults, liveResults) {
  const seen = new Set(localResults.map(p => (p.code || '').toUpperCase().replace(/[-\s]/g, '')));
  const merged = [...localResults];
  for (const p of liveResults) {
    const normCode = (p.code || '').toUpperCase().replace(/[-\s]/g, '');
    if (!seen.has(normCode)) {
      seen.add(normCode);
      merged.push(p);
    }
  }
  return merged;
}

async function fetchJaquarProduct(url) {
  try {
    const res = await fetch(`${PRODUCT_API}?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function useDebounce(value, delay = 150) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Search Dropdown Component ── */
function JaquarSearchDropdown({ results, loading, liveLoading, onSelect, visible }) {
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
          <span className="jq-spinner" /> Search ho raha hai...
        </div>
      )}
      {!loading && results.length === 0 && !liveLoading && (
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
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
              {p.code}
              {p._live && (
                <span style={{ fontSize: 8, color: '#38bdf8', background: 'rgba(56,189,248,0.12)', padding: '1px 5px', borderRadius: 6, fontWeight: 600, letterSpacing: '0.04em' }}>
                  🌐 LIVE
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {p.name}
            </div>
            {p.price && (
              <div style={{ fontSize: 10, color: '#22c55e', marginTop: 1, fontWeight: 600 }}>
                MRP ₹{typeof p.price === 'number' ? p.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : p.price}
              </div>
            )}
          </div>
        </button>
      ))}
      {liveLoading && (
        <div style={{ padding: '8px 12px', fontSize: 10, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(56,189,248,0.04)' }}>
          <span className="jq-spinner" /> Jaquar.com se live search ho raha hai...
        </div>
      )}
    </div>
  );
}

const emptyLabel = () => ({
  product: '', code: '', price: '', manufacturer: '', logoUrl: '', description: '', productUrl: '', size: '', qty: '',
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

function LabelCard({ index, label, onChange, onFillMulti, onDuplicateToAll, onReset, isActive, onActivate }) {
  const [open, setOpen] = useState(index === 0);
  const cardRef = useRef(null);
  const filled = isFilled(label);
  const [priceHint, setPriceHint] = useState('');

  // Jaquar search state
  const [searchField, setSearchField] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [productDB, setProductDB] = useState(_productDB); // sync init if already loaded
  const debouncedQuery = useDebounce(searchQuery, 150);
  const wrapperRef = useRef(null);

  // Ensure product database is loaded
  useEffect(() => {
    if (_productDB) { setProductDB(_productDB); return; }
    loadProductDB().then(db => setProductDB(db));
  }, []);

  // Bug #13 fix: cancelled flag to prevent stale search results
  // Live fallback: when local results are few, also search jaquar.com
  useEffect(() => {
    let cancelled = false;

    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      setLiveLoading(false);
      setShowDropdown(false);
      return;
    }

    const doSearch = async (db) => {
      const localResults = searchLocal(debouncedQuery, db);
      if (cancelled) return;
      setSearchResults(localResults);
      setSearchLoading(false);
      setShowDropdown(true);

      // Live fallback: fetch from jaquar.com if local results are scarce
      if (localResults.length < LIVE_SEARCH_THRESHOLD && debouncedQuery.length >= 3) {
        setLiveLoading(true);
        const liveResults = await fetchLiveSearch(debouncedQuery);
        if (cancelled) return;
        if (liveResults.length > 0) {
          setSearchResults(prev => mergeResults(prev, liveResults));
        }
        setLiveLoading(false);
      }
    };

    if (!productDB) {
      setSearchLoading(true);
      setShowDropdown(true);
      loadProductDB().then(db => {
        if (cancelled) return;
        setProductDB(db);
        doSearch(db);
      });
    } else {
      doSearch(productDB);
    }

    return () => { cancelled = true; };
  }, [debouncedQuery, productDB]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
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
    if (value.length >= 2) {
      setSearchLoading(true);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
      setSearchLoading(false);
    }
  };

  const handleProductSelect = async (product) => {
    setShowDropdown(false);
    setSearchQuery('');
    setSearchResults([]);

    // Build product URL for Jaquar website
    const jaquarUrl = product.url ? `https://www.jaquar.com${product.url}` : '';

    // Fill ALL fields instantly from local DB (code, name, price)
    const fields = {
      code: product.code || '',
      product: product.name || '',
      productUrl: jaquarUrl,
    };
    if (product.price) {
      const priceStr = typeof product.price === 'number'
        ? product.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })
        : product.price;
      fields.price = priceStr;
      setPriceHint(`✅ Jaquar MRP ₹${priceStr} (jaquar.com)`);
    }
    onFillMulti(fields);

    // Fetch full details on-demand (description + price for live results)
    if (product.url) {
      setFetchingDetail(true);
      const detail = await fetchJaquarProduct(product.url).catch(() => null);
      if (detail) {
        const extras = {};
        if (detail.description) extras.description = detail.description;
        // For live results without price, fill price from product page
        if (!product.price && detail.price) {
          extras.price = detail.price;
          setPriceHint(`✅ Jaquar MRP ${detail.price} (jaquar.com — live)`);
        }
        if (Object.keys(extras).length) onFillMulti(extras);
      }
      setFetchingDetail(false);
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
            {label.code?.trim() && (
              <div style={{ fontSize: 10, color: '#f97316', marginTop: 1, fontFamily: 'monospace', letterSpacing: '0.03em' }}>
                {label.code} {label.price?.trim() ? ` • ₹${label.price}` : ''}
              </div>
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
        <div ref={wrapperRef} style={{ padding: 14, background: '#0f172a', borderTop: '1px solid #1e293b' }}>
          {fetchingDetail && (
            <div style={{ padding: '8px 0', fontSize: 11, color: '#f97316', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="jq-spinner" /> Product details load ho raha hai...
            </div>
          )}
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
                <div style={{ gridColumn: span === 2 ? '1 / -1' : undefined, position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4, letterSpacing: '0.05em' }}>
                    {fl}
                    {searchable && <span style={{ color: '#f97316', fontSize: 9, marginLeft: 4 }}>🔍 Jaquar</span>}
                  </label>
                  <input
                    type="text"
                    value={label[key] || ''}
                    onChange={e => {
                      if (searchable) handleSearchableChange(key, e.target.value);
                      else {
                        let val = e.target.value;
                        // Sanitize logo URL — only allow http(s) and relative paths
                        if (key === 'logoUrl' && val.trim() && !/^(https?:\/\/|\/)/i.test(val.trim())) {
                          val = '';
                        }
                        onChange(key, val);
                        if (key === 'price') setPriceHint('');
                      }
                    }}
                    onBlur={e => {
                      if (key === 'price' && e.target.value.trim()) {
                        const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
                        if (cleaned !== e.target.value) onChange(key, cleaned);
                      }
                    }}
                    onFocus={() => { if (searchable) { setSearchField(key); if (searchResults.length > 0) setShowDropdown(true); } }}
                    placeholder={placeholder}
                    className="input-dark"
                    style={{ fontSize: 12, padding: '7px 10px' }}
                  />
                  {key === 'price' && priceHint && (
                    <div style={{ fontSize: 9, color: '#22c55e', marginTop: 3, lineHeight: 1.3 }}>
                      {priceHint}
                    </div>
                  )}
                  {searchable && searchField === key && (
                    <JaquarSearchDropdown
                      results={searchResults}
                      loading={searchLoading}
                      liveLoading={liveLoading}
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
  const [dragIdx, setDragIdx]               = useState(null);
  const [dragOverIdx, setDragOverIdx]       = useState(null);

  // Bug #3 fix: clamp activeIndex when labels array changes
  useEffect(() => {
    if (activeIndex >= labels.length) setActiveIndex(Math.max(0, labels.length - 1));
  }, [labels.length, activeIndex]);

  const updateLabel    = (index, key, value) => setLabels(prev => prev.map((l, i) => i === index ? { ...l, [key]: value } : l));
  const updateLabelMulti = (index, fields) => setLabels(prev => prev.map((l, i) => i === index ? { ...l, ...fields } : l));
  const resetLabel     = (index)             => setLabels(prev => prev.map((l, i) => i === index ? emptyLabel() : l));
  const duplicateToAll = (src)               => setLabels(prev => prev.map(() => ({ ...src })));

  // Drag & Drop handlers
  const handleDragStart = (idx) => { setDragIdx(idx); };
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (idx) => {
    if (dragIdx !== null && dragIdx !== idx) {
      setLabels(prev => {
        const updated = [...prev];
        const [dragged] = updated.splice(dragIdx, 1);
        updated.splice(idx, 0, dragged);
        return updated;
      });
      setActiveIndex(idx);
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const handleApplyAll = () => {
    setLabels(prev => prev.map(l => {
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

      {/* Active Selection Indicator */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,88,12,0.08))',
        border: '1px solid rgba(249,115,22,0.3)',
        borderRadius: 10, padding: '8px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        animation: 'glow-ring 2.5s ease-in-out infinite',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,#f97316,#ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: 'white',
          boxShadow: '0 0 12px rgba(249,115,22,0.4)',
        }}>
          {activeIndex + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#f97316', letterSpacing: '0.1em', marginBottom: 1 }}>
            CURRENTLY EDITING — LABEL {activeIndex + 1}
          </div>
          <div style={{ fontSize: 12, color: '#f1f5f9', fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {labels[activeIndex]?.product?.trim() || labels[activeIndex]?.code?.trim() || 'Empty label'}
            {labels[activeIndex]?.code?.trim() && labels[activeIndex]?.product?.trim() && (
              <span style={{ color: '#94a3b8', fontWeight: 400, marginLeft: 6, fontSize: 10, fontFamily: 'monospace' }}>
                {labels[activeIndex].code}
              </span>
            )}
          </div>
        </div>
        {isFilled(labels[activeIndex]) && (
          <span style={{ fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.12)', padding: '3px 8px', borderRadius: 10, fontWeight: 600, flexShrink: 0 }}>
            ✓ FILLED
          </span>
        )}
      </div>

      {/* Dot Navigator */}
      <div className="depth-shadow" style={{ background: 'linear-gradient(180deg, #1e293b, #1a2536)', borderRadius: 12, padding: '12px 14px', border: '1px solid #334155' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.08em', marginBottom: 10 }}>
          JUMP TO LABEL
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {labels.map((l, i) => (
            <button
              key={i}
              className={`label-dot${i === activeIndex ? ' active' : ''}${isFilled(l) ? ' filled' : ''}`}
              onClick={() => setActiveIndex(i)}
              title={l.code?.trim() ? `${l.code} — ${l.product || ''}` : (l.product?.trim() || `Label ${i + 1}`)}
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

        {/* Quick summary: which label has which code */}
        {filledCount > 0 && (
          <div style={{ marginTop: 10, borderTop: '1px solid #334155', paddingTop: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#475569', letterSpacing: '0.08em', marginBottom: 5 }}>FILLED LABELS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {labels.map((l, i) => {
                if (!isFilled(l)) return null;
                return (
                  <button key={i} onClick={() => setActiveIndex(i)} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px',
                    background: i === activeIndex ? 'rgba(249,115,22,0.1)' : 'transparent',
                    border: 'none', borderRadius: 4, cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: 'white',
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 10, color: '#f97316', fontFamily: 'monospace', fontWeight: 600 }}>
                      {l.code?.trim() || '—'}
                    </span>
                    <span style={{ fontSize: 9, color: '#64748b', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>
                      {l.product?.trim() || ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            style={{
              opacity: dragIdx === i ? 0.4 : 1,
              borderTop: dragOverIdx === i && dragIdx !== null && dragIdx !== i ? '2px solid #f97316' : '2px solid transparent',
              transition: 'opacity 0.15s',
            }}
          >
            <LabelCard
              index={i}
              label={label}
              isActive={activeIndex === i}
              onActivate={setActiveIndex}
              onChange={(key, value) => updateLabel(i, key, value)}
              onFillMulti={(fields) => updateLabelMulti(i, fields)}
              onDuplicateToAll={duplicateToAll}
              onReset={resetLabel}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
