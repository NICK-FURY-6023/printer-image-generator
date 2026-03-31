/*
 * Hardware product label — 105mm × 48mm (Jaquar-type packaging sticker)
 * ┌───┬──────────────────────────────────────────┐
 * │   │ [LOGO]                      [QR]         │
 * │ M │──────────────────────────────────────────│
 * │ O │ │ Size │ Qty │ MRP (Per Piece) │        │
 * │ D │ │ 15mm │  1  │   ₹3,800.00    │        │
 * │ E │──────────────────────────────────────────│
 * │ L │ Product Name       │ [PRODUCT IMAGE]    │
 * │   │ Description text   │                    │
 * │   │──────────────────────────────────────────│
 * │   │ Jaquar & Co. Pvt. Ltd.  |  Made in India│
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
  const productImage = label.productImage?.trim() || '';
  // Proxy jaquar.com images to avoid CORS/referrer blocking
  const productImageSrc = productImage.startsWith('https://www.jaquar.com/')
    ? `/api/image-proxy?url=${encodeURIComponent(productImage)}`
    : productImage;
  const qrDataUrl = useQRCode(productUrl);
  const s = (pt) => `${pt * fontScale}pt`;
  const B = '0.18mm solid #000';
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

      {/* ── LEFT VERTICAL STRIP — Model Number (rotated 90°, centered) ── */}
      <div style={{
        width: '5.5mm', flexShrink: 0, borderRight: B,
        background: '#000', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
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
        overflow: 'hidden', minWidth: 0,
      }}>

        {/* ── TOP ROW: Brand Logo (left) + QR Code (right) ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: BT, padding: '0.5mm 1mm',
          minHeight: '8mm', flexShrink: 0,
        }}>
          {/* Brand Logo — large, dark, bold */}
          <div style={{
            flex: '0 0 auto', display: 'flex', alignItems: 'center',
            maxWidth: '60%', overflow: 'hidden',
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

          {/* QR Code — shifted left to avoid print-cutoff */}
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR" style={{
              width: '7mm', height: '7mm',
              objectFit: 'contain', flexShrink: 0,
              marginRight: '3mm',
            }} />
          )}
        </div>

        {/* ── MIDDLE: Size / Qty / MRP Table ── */}
        <div style={{
          borderBottom: BT, flexShrink: 0,
          padding: '0.3mm 1mm',
        }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            textAlign: 'center',
          }}>
            <thead>
              <tr>
                <th style={{ borderBottom: BT, borderRight: BT, padding: '0.3mm 0.5mm', fontWeight: 900, fontSize: s(4.5) }}>Size</th>
                <th style={{ borderBottom: BT, borderRight: BT, padding: '0.3mm 0.5mm', fontWeight: 900, fontSize: s(4.5) }}>Qty</th>
                <th style={{ borderBottom: BT, padding: '0.3mm 0.5mm', fontWeight: 900, fontSize: s(4.5) }}>MRP (Per Piece)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ borderRight: BT, padding: '0.3mm 0.5mm', fontSize: s(5) }}>{size || '—'}</td>
                <td style={{ borderRight: BT, padding: '0.3mm 0.5mm', fontSize: s(5) }}>{qty || '—'}</td>
                <td style={{ padding: '0.3mm 0.5mm', fontWeight: 800, fontSize: s(5.5) }}>
                  {price ? `\u20B9${price}` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── PRODUCT NAME + DESCRIPTION + PRODUCT IMAGE ── */}
        <div style={{
          flex: '1 1 auto', display: 'flex', overflow: 'hidden',
          borderBottom: BT,
        }}>
          {/* Left: Text content */}
          <div style={{
            flex: '1 1 auto', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', padding: '0.3mm 1.5mm',
            overflow: 'hidden', minWidth: 0,
          }}>
            {product && (
              <span style={{
                fontSize: s(5), fontWeight: 900,
                textTransform: 'uppercase', lineHeight: 1.2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                display: 'block',
              }}>
                {product}
              </span>
            )}
            {(description || (!product && !isEmpty)) && (
              <span style={{
                fontSize: s(3.8), fontWeight: 600,
                lineHeight: 1.2, textTransform: 'uppercase',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                overflow: 'hidden', wordBreak: 'break-word',
                marginTop: product ? '0.3mm' : 0,
              }}>
                {description || ''}
              </span>
            )}
          </div>

          {/* Right: Product Image */}
          {hasProductImg && (
            <div style={{
              flex: '0 0 auto', display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: '0.5mm',
              borderLeft: BT, width: '14mm',
            }}>
              <img src={productImageSrc} alt="Product"
                onError={() => setImgError(true)}
                style={{
                  maxHeight: '100%', maxWidth: '13mm',
                  objectFit: 'contain',
                }} />
            </div>
          )}
        </div>

        {/* ── FOOTER — Company name + Made in India (normal weight) ── */}
        <div style={{
          flexShrink: 0, padding: '0.4mm 1mm 0.3mm',
          fontSize: s(3.5), lineHeight: 1.3, color: '#000',
          fontWeight: 400, borderTop: BT,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>Jaquar & Co. Pvt. Ltd.</span>
          <span>Made in India</span>
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
  prev.label.productUrl === next.label.productUrl &&
  prev.label.productImage === next.label.productImage
);

// Bug #4 fix: proper default label so .trim() never hits undefined
const defaultLabel = { product: '', code: '', price: '', manufacturer: '', logoUrl: '', description: '', productUrl: '', productImage: '', size: '', qty: '' };

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
