/*
 * Hardware product label — 105mm × 48mm (Jaquar-type packaging sticker)
 * ┌───┬──────────────────────────────────────────┐
 * │   │ [BRAND LOGO]              [QR CODE]      │
 * │ M │──────────────────────────────────────────│
 * │ O │ │  Size  │  Qty  │  MRP (Per Piece)  │  │
 * │ D │ │  15mm  │   1   │     ₹3,800.00     │  │
 * │ E │──────────────────────────────────────────│
 * │ L │ CONCEALED BODY FOR SINGLE LEVER HIGH     │
 * │   │ FLOW DIVERTER WITH BUTTON ASSEMBLY...    │
 * │   │──────────────────────────────────────────│
 * │   │ Mfg by: Company  |  Address: India       │
 * └───┴──────────────────────────────────────────┘
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
  const size = label.size?.trim() || '';
  const qty = label.qty?.trim() || '';
  const logoUrl = label.logoUrl?.trim() || '/jaquar-logo.png';
  const productUrl = label.productUrl?.trim() || '';
  const qrDataUrl = useQRCode(productUrl);
  const s = (pt) => `${pt * fontScale}pt`;
  const B = '0.2mm solid #000';
  const BT = '0.15mm solid #000';
  const [logoError, setLogoError] = useState(false);

  const isEmpty = !code && !product && !price && !description;

  return (
    <div style={{
      width: '100%', height: '100%',
      border: B, boxSizing: 'border-box',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#000', display: 'flex',
      overflow: 'hidden', background: '#fff',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    }}>

      {/* ── LEFT VERTICAL STRIP — Model Number (rotated 90°) ── */}
      <div style={{
        width: '7mm', flexShrink: 0, borderRight: B,
        background: '#000', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        <span style={{
          transform: 'rotate(-90deg)',
          whiteSpace: 'nowrap',
          fontSize: s(7), fontWeight: 900,
          letterSpacing: '0.08em',
        }}>
          {code || (isEmpty ? '' : 'MODEL')}
        </span>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{
        flex: '1 1 auto', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', minWidth: 0,
      }}>

        {/* ── TOP ROW: Brand Logo (left) + QR Code (right) ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: BT, padding: '1mm 1.5mm',
          minHeight: '11mm', flexShrink: 0,
        }}>
          {/* Brand Logo */}
          <div style={{
            flex: '0 0 auto', display: 'flex', alignItems: 'center',
            maxWidth: '55%', overflow: 'hidden',
          }}>
            {logoUrl && !logoError ? (
              <img src={logoUrl} alt={brand} crossOrigin="anonymous"
                onError={() => setLogoError(true)}
                style={{
                  maxHeight: '9mm', maxWidth: '26mm',
                  objectFit: 'contain',
                  filter: 'grayscale(100%) contrast(1.5)',
                }} />
            ) : (
              <span style={{
                fontSize: s(12), fontWeight: 900,
                letterSpacing: '0.15em', textTransform: 'uppercase',
              }}>
                {brand || (isEmpty ? '' : 'BRAND')}
              </span>
            )}
          </div>

          {/* QR Code */}
          {qrDataUrl && (
            <div style={{
              flex: '0 0 auto', display: 'flex', alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img src={qrDataUrl} alt="QR" style={{
                width: '9mm', height: '9mm',
                objectFit: 'contain',
              }} />
            </div>
          )}
        </div>

        {/* ── MIDDLE: Size / Qty / MRP Table ── */}
        <div style={{
          borderBottom: BT, flexShrink: 0,
          padding: '0.5mm 1.5mm',
        }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontSize: s(6), textAlign: 'center',
          }}>
            <thead>
              <tr>
                <th style={{ borderBottom: BT, borderRight: BT, padding: '0.5mm 1mm', fontWeight: 900, fontSize: s(5.5) }}>Size</th>
                <th style={{ borderBottom: BT, borderRight: BT, padding: '0.5mm 1mm', fontWeight: 900, fontSize: s(5.5) }}>Qty</th>
                <th style={{ borderBottom: BT, padding: '0.5mm 1mm', fontWeight: 900, fontSize: s(5.5) }}>MRP (Per Piece)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ borderRight: BT, padding: '0.5mm 1mm', fontSize: s(6) }}>{size || '—'}</td>
                <td style={{ borderRight: BT, padding: '0.5mm 1mm', fontSize: s(6) }}>{qty || '—'}</td>
                <td style={{ padding: '0.5mm 1mm', fontWeight: 800, fontSize: s(6.5) }}>
                  {price ? `\u20B9${price}` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── PRODUCT DESCRIPTION — Center, ALL CAPS ── */}
        <div style={{
          flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: BT, padding: '0.5mm 2mm',
          overflow: 'hidden', textAlign: 'center',
        }}>
          <span style={{
            fontSize: s(5), fontWeight: 700,
            lineHeight: 1.3, textTransform: 'uppercase',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            overflow: 'hidden', wordBreak: 'break-word',
          }}>
            {description || product || ''}
          </span>
        </div>

        {/* ── FOOTER — Manufacturer + Address ── */}
        <div style={{
          flexShrink: 0, padding: '0.5mm 1.5mm',
          fontSize: s(3.8), lineHeight: 1.3, color: '#000',
          display: 'flex', flexDirection: 'column', gap: '0.2mm',
        }}>
          {brand && (
            <span><strong>Manufactured by:</strong> {brand}</span>
          )}
          <span><strong>Address:</strong> India</span>
        </div>

      </div>
    </div>
  );
}, (prev, next) =>
  prev.fontScale === next.fontScale &&
  prev.fieldStyles === next.fieldStyles &&
  prev.label.code === next.label.code &&
  prev.label.product === next.label.product &&
  prev.label.description === next.label.description &&
  prev.label.price === next.label.price &&
  prev.label.size === next.label.size &&
  prev.label.qty === next.label.qty &&
  prev.label.logoUrl === next.label.logoUrl &&
  prev.label.manufacturer === next.label.manufacturer &&
  prev.label.productUrl === next.label.productUrl
);

// Bug #4 fix: proper default label so .trim() never hits undefined
const defaultLabel = { product: '', code: '', price: '', manufacturer: '', logoUrl: '', description: '', productUrl: '', size: '', qty: '' };

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
