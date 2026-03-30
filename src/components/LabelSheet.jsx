/*
 * Clean product label — 105mm × 48mm
 * ┌────────┬─────────────────────────────────────┬──────┐
 * │        │ Product Code  :  ALD-CHR-055N        │      │
 * │ [LOGO] │ Product Name  :  CONCEALED BODY DIV  │ [QR] │
 * │        │ Product Desc  :  High quality brass.. │      │
 * │        │ Product Price :  ₹ 3,800.00          │      │
 * └────────┴─────────────────────────────────────┴──────┘
 */

import { useState, useEffect, memo } from 'react';
import QRCode from 'qrcode';

// Generate QR code data URL (LRU cache — max 50 entries)
const qrCache = new Map();
const QR_CACHE_MAX = 50;
function useQRCode(url) {
  const [dataUrl, setDataUrl] = useState(qrCache.get(url) || '');
  useEffect(() => {
    if (!url) { setDataUrl(''); return; }
    if (qrCache.has(url)) { setDataUrl(qrCache.get(url)); return; }
    QRCode.toDataURL(url, { width: 120, margin: 0, errorCorrectionLevel: 'M' })
      .then(d => {
        if (qrCache.size >= QR_CACHE_MAX) qrCache.delete(qrCache.keys().next().value);
        qrCache.set(url, d);
        setDataUrl(d);
      })
      .catch(() => setDataUrl(''));
  }, [url]);
  return dataUrl;
}

const LabelCell = memo(function LabelCell({ label, fontScale = 1, fieldStyles }) {
  const brand = label.manufacturer?.trim() || '';
  const code = label.code?.trim() || '';
  const product = label.product?.trim() || '';
  const description = label.description?.trim() || '';
  const price = label.price?.trim() || '';
  const logoUrl = label.logoUrl?.trim() || '/jaquar-logo.png';
  const productUrl = label.productUrl?.trim() || '';
  const qrDataUrl = useQRCode(productUrl);
  const fs = fieldStyles || {};
  const s = (pt) => `${pt * fontScale}pt`;
  const sf = (pt, field) => `${pt * fontScale * (fs[field]?.size || 1)}pt`;
  const wf = (base, field) => Math.min(950, Math.round(base * (fs[field]?.bold || 1)));
  const B = '0.2mm solid #222';
  const [logoError, setLogoError] = useState(false);

  return (
    <div style={{
      width: '100%', height: '100%',
      border: B, boxSizing: 'border-box',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#000', display: 'flex',
      overflow: 'hidden',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    }}>

      {/* ── LEFT — Brand Logo ── */}
      <div style={{
        width: '18mm', flexShrink: 0, borderRight: B,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5mm 1.5mm 1.5mm 3mm', overflow: 'hidden',
      }}>
        {logoUrl && !logoError ? (
          <img src={logoUrl} alt={brand} crossOrigin="anonymous" onError={() => setLogoError(true)} style={{
            maxWidth: '95%', maxHeight: '95%',
            objectFit: 'contain',
          }} />
        ) : (
          <span style={{
            fontSize: s(10), fontWeight: 700, fontStyle: 'italic',
            fontFamily: 'Georgia, "Times New Roman", serif',
            textAlign: 'center', wordBreak: 'break-word',
            lineHeight: 1.1,
          }}>
            {brand || <span style={{ color: '#ccc', fontStyle: 'normal', fontWeight: 400, fontSize: s(7) }}>Brand</span>}
          </span>
        )}
      </div>

      {/* ── CENTER — Product Details ── */}
      <div style={{
        flex: '1 1 auto', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '1mm 2mm',
        overflow: 'hidden', minWidth: 0, gap: '0.6mm',
      }}>
        {code && (
          <div style={{ display: 'flex', alignItems: 'baseline', fontSize: sf(7, 'code'), lineHeight: 1.3, flexShrink: 0 }}>
            <span style={{ fontWeight: wf(900, 'code'), flexShrink: 0, minWidth: '16mm' }}>Product Code</span>
            <span style={{ fontWeight: wf(900, 'code'), flexShrink: 0, margin: '0 0.5mm' }}>:</span>
            <span style={{ fontWeight: wf(800, 'code'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{code}</span>
          </div>
        )}

        {product && (
          <div style={{ display: 'flex', alignItems: 'flex-start', fontSize: sf(6.5, 'name'), lineHeight: 1.3, flexShrink: 0 }}>
            <span style={{ fontWeight: wf(900, 'name'), flexShrink: 0, minWidth: '16mm', fontSize: sf(7, 'name') }}>Product Name</span>
            <span style={{ fontWeight: wf(900, 'name'), flexShrink: 0, margin: '0 0.5mm', fontSize: sf(7, 'name') }}>:</span>
            <span style={{
              fontWeight: wf(700, 'name'), textTransform: 'uppercase', wordBreak: 'break-word',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {product}
            </span>
          </div>
        )}

        {description && (
          <div style={{ display: 'flex', alignItems: 'flex-start', fontSize: sf(5.5, 'desc'), lineHeight: 1.3, flexShrink: 0 }}>
            <span style={{ fontWeight: wf(900, 'desc'), flexShrink: 0, minWidth: '16mm', fontSize: sf(7, 'desc') }}>Product Desc</span>
            <span style={{ fontWeight: wf(900, 'desc'), flexShrink: 0, margin: '0 0.5mm', fontSize: sf(7, 'desc') }}>:</span>
            <span style={{
              fontWeight: wf(600, 'desc'), wordBreak: 'break-word',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {description}
            </span>
          </div>
        )}

        {price && (
          <div style={{ display: 'flex', alignItems: 'baseline', fontSize: sf(7, 'price'), lineHeight: 1.3, flexShrink: 0 }}>
            <span style={{ fontWeight: wf(900, 'price'), flexShrink: 0, minWidth: '16mm' }}>Product Price</span>
            <span style={{ fontWeight: wf(900, 'price'), flexShrink: 0, margin: '0 0.5mm' }}>:</span>
            <span style={{ fontWeight: wf(900, 'price'), fontSize: sf(8, 'price') }}>
              {`\u20B9 ${price}`}
            </span>
          </div>
        )}
      </div>

      {/* ── RIGHT — QR Code (only if product URL exists) ── */}
      {qrDataUrl && (
        <div style={{
          width: '13mm', flexShrink: 0, borderLeft: B,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5mm', overflow: 'hidden',
        }}>
          <img src={qrDataUrl} alt="QR" style={{
            width: '100%', maxHeight: '100%',
            objectFit: 'contain',
          }} />
        </div>
      )}

    </div>
  );
// Bug #12 fix: custom comparator so memo actually prevents re-renders
}, (prev, next) =>
  prev.fontScale === next.fontScale &&
  prev.fieldStyles === next.fieldStyles &&
  prev.label.code === next.label.code &&
  prev.label.product === next.label.product &&
  prev.label.description === next.label.description &&
  prev.label.price === next.label.price &&
  prev.label.logoUrl === next.label.logoUrl &&
  prev.label.manufacturer === next.label.manufacturer &&
  prev.label.productUrl === next.label.productUrl
);

// Bug #4 fix: proper default label so .trim() never hits undefined
const defaultLabel = { product: '', code: '', price: '', manufacturer: '', logoUrl: '', description: '', productUrl: '' };

export default function LabelSheet({ labels, extraTopMargin = 0, fontScale = 1, fieldStyles }) {
  const safeLabels = Array.from({ length: 12 }, (_, i) => ({ ...defaultLabel, ...(labels[i] || {}) }));
  return (
    <div
      className="sheet print-sheet"
      style={extraTopMargin !== 0 ? { paddingTop: `${7 + extraTopMargin}mm`, paddingBottom: `${7 - extraTopMargin}mm` } : undefined}
    >
      {safeLabels.map((label, i) => (
        <LabelCell key={i} label={label} fontScale={fontScale} fieldStyles={fieldStyles} />
      ))}
    </div>
  );
}
