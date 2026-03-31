/*
 * Hardware product label — 105mm × 48mm (Jaquar-type packaging sticker)
 * ┌════╦══════════════════════════════════════════┐
 * ║    ║ [LOGO] [QR]                              ║
 * ║ M  ║──────────────────────────────────────────║
 * ║ O  ║ │ Size │ Qty │ MRP (Per Piece)  │        ║
 * ║ D  ║ │ 15mm │  1  │ ₹3,800 (incl.)  │        ║
 * ║ E  ║──────────────────────────────────────────║
 * ║ L  ║ Product Name       │ [PRODUCT IMAGE]    ║
 * ║    ║ Description text   │                    ║
 * ║    ║──────────────────────────────────────────║
 * ║    ║ Jaquar & Co. Pvt. Ltd.    Made in India  ║
 * ║    ║ Mth/Yr: 03/2026  Customer Care: 1800... ║
 * └════╩══════════════════════════════════════════┘
 */

import { useState, useEffect, memo } from 'react';
import QRCode from 'qrcode';
import { generateMfgDate } from '../utils/mfgDate';

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
  const mfgDate = label.mfgDate?.trim() || generateMfgDate();
  const logoUrl = label.logoUrl?.trim() || '/jaquar-logo.png';
  const productUrl = label.productUrl?.trim() || '';
  const productImage = label.productImage?.trim() || '';
  // Proxy jaquar.com images to avoid CORS/referrer blocking
  const productImageSrc = productImage.startsWith('https://www.jaquar.com/')
    ? `/api/image-proxy?url=${encodeURIComponent(productImage)}`
    : productImage;
  const qrDataUrl = useQRCode(productUrl);
  const s = (pt) => `${pt * fontScale}pt`;
  const B = '0.35mm solid #000';
  const BT = '0.12mm solid #000';
  const [logoError, setLogoError] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isEmpty = !code && !product && !price && !description;
  const hasProductImg = productImage && !imgError;

  return (
    <div style={{
      width: '100%', height: '100%',
      border: B, boxSizing: 'border-box',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#000', display: 'flex',
      overflow: 'hidden', background: '#fff',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    }}>

      {/* ── LEFT VERTICAL STRIP — Model Number (rotated, centered) ── */}
      <div style={{
        width: '5.5mm', flexShrink: 0, borderRight: B,
        background: '#fff', color: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <span style={{
          transform: 'rotate(-90deg)',
          whiteSpace: 'nowrap',
          fontSize: s(5), fontWeight: 900,
          letterSpacing: '0.04em',
        }}>
          {code || (isEmpty ? '' : 'MODEL')}
        </span>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{
        flex: '1 1 auto', display: 'flex', flexDirection: 'column',
        minWidth: 0, overflow: 'hidden',
      }}>

        {/* ── TOP ROW: Brand Logo + QR Code ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          borderBottom: BT, padding: '0.8mm 1.2mm',
          minHeight: '8mm', flexShrink: 0, gap: '1.5mm',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            flex: '0 0 auto', display: 'flex', alignItems: 'center',
          }}>
            {logoUrl && !logoError ? (
              <img src={logoUrl} alt={brand} crossOrigin="anonymous"
                onError={() => setLogoError(true)}
                style={{
                  maxHeight: '9mm', maxWidth: '28mm',
                  objectFit: 'contain',
                  filter: 'grayscale(100%) contrast(5) brightness(0)',
                }} />
            ) : (
              <span style={{
                fontSize: s(11), fontWeight: 900,
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>
                {brand || (isEmpty ? '' : 'BRAND')}
              </span>
            )}
          </div>

          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR" style={{
              width: '7mm', height: '7mm',
              objectFit: 'contain', flexShrink: 0,
            }} />
          )}
        </div>

        {/* ── MIDDLE: Size / Qty / MRP Table ── */}
        <div style={{
          borderBottom: BT, flexShrink: 0,
          padding: '0.3mm 1mm',
          position: 'relative', zIndex: 1,
        }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            textAlign: 'center',
          }}>
            <thead>
              <tr>
                <th style={{ borderBottom: BT, borderRight: BT, padding: '0.5mm 0.8mm', fontWeight: 900, fontSize: s(4.5), verticalAlign: 'middle' }}>Size</th>
                <th style={{ borderBottom: BT, borderRight: BT, padding: '0.5mm 0.8mm', fontWeight: 900, fontSize: s(4.5), verticalAlign: 'middle' }}>Qty</th>
                <th style={{ borderBottom: BT, padding: '0.5mm 0.8mm', fontWeight: 900, fontSize: s(4.5), verticalAlign: 'middle' }}>MRP (Per Piece)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ borderRight: BT, padding: '0.8mm', fontSize: s(5), verticalAlign: 'middle' }}>{size || '—'}</td>
                <td style={{ borderRight: BT, padding: '0.8mm', fontSize: s(5), verticalAlign: 'middle' }}>{qty || '—'}</td>
                <td style={{ padding: '0.5mm 0.8mm', fontWeight: 800, fontSize: s(5.5), verticalAlign: 'middle', lineHeight: 1.1 }}>
                  {price ? `\u20B9${price.replace(/^[\s₹Rs.]+/i, '').trim()}` : '—'}
                  {price && (
                    <div style={{ fontSize: s(2.8), fontWeight: 400, marginTop: '0.3mm', lineHeight: 1 }}>(Incl. of All Taxes)</div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── PRODUCT NAME + DESCRIPTION + PRODUCT IMAGE ── */}
        <div style={{
          flex: '1 1 auto', display: 'flex',
          borderBottom: BT, minHeight: 0,
          position: 'relative', zIndex: 1, overflow: 'hidden',
        }}>
          {/* Left: Text content */}
          <div style={{
            flex: '1 1 auto', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', padding: '0.8mm 1.5mm',
            minWidth: 0, overflow: 'hidden',
          }}>
            {product && (
              <span style={{
                fontSize: s(5), fontWeight: 900,
                textTransform: 'uppercase', lineHeight: 1.25,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden', wordBreak: 'break-word',
              }}>
                {product}
              </span>
            )}
            {(description || (!product && !isEmpty)) && (
              <span style={{
                fontSize: s(3.8), fontWeight: 600,
                lineHeight: 1.25, textTransform: 'uppercase',
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                overflow: 'hidden', wordBreak: 'break-word',
                marginTop: product ? '0.5mm' : 0,
              }}>
                {description || ''}
              </span>
            )}
          </div>

          {/* Right: Product Image */}
          {hasProductImg && (
            <div style={{
              flex: '0 0 auto', display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '0.8mm',
              borderLeft: BT, width: '11mm',
            }}>
              <img src={productImageSrc} alt="Product"
                onError={() => setImgError(true)}
                style={{
                  maxHeight: '100%', maxWidth: '10mm',
                  objectFit: 'contain',
                }} />
            </div>
          )}
        </div>

        {/* ── FOOTER — Company/India, Mfg date/Email, Phone ── */}
        <div style={{
          flexShrink: 0, padding: '0.5mm 1.2mm',
          fontSize: s(3.2), lineHeight: 1.3, color: '#000',
          fontWeight: 400, position: 'relative', zIndex: 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Jaquar & Co. Pvt. Ltd.</span>
            <span>Made in India</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: s(2.8), color: '#333' }}>
            <span>Mth/Yr of Mfg: {mfgDate || '___/____'}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3mm' }}>
              <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 4L12 13 2 4"/>
              </svg>
              service@jaquar.com
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: s(2.8), color: '#333' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3mm' }}>
              <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.81.36 1.6.68 2.35a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.75.32 1.54.55 2.35.68A2 2 0 0122 16.92z"/>
              </svg>
              1800-102-9900
            </span>
          </div>
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
  prev.label.mfgDate === next.label.mfgDate &&
  prev.label.logoUrl === next.label.logoUrl &&
  prev.label.manufacturer === next.label.manufacturer &&
  prev.label.productUrl === next.label.productUrl &&
  prev.label.productImage === next.label.productImage
);

// Bug #4 fix: proper default label so .trim() never hits undefined
const defaultLabel = { product: '', code: '', price: '', manufacturer: '', logoUrl: '', description: '', productUrl: '', productImage: '', size: '', qty: '', mfgDate: '' };

export default function LabelSheet({ labels, extraTopMargin = 0, fontScale = 1, fieldStyles }) {
  const safeLabels = Array.from({ length: 12 }, (_, i) => {
    const l = { ...defaultLabel, ...(labels[i] || {}) };
    if (!l.mfgDate) l.mfgDate = generateMfgDate();
    return l;
  });
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
