/*
 * Clean product label — 105mm × 48mm
 * ┌────────┬─────────────────────────────────────┬──────┐
 * │        │ Product Code  :  ALD-CHR-055N        │      │
 * │ [LOGO] │ Product Name  :  CONCEALED BODY DIV  │ [QR] │
 * │        │ Product Desc  :  High quality brass.. │      │
 * │        │ Product Price :  ₹ 3,800.00          │      │
 * └────────┴─────────────────────────────────────┴──────┘
 */

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

// Generate QR code data URL (cached per URL)
const qrCache = {};
function useQRCode(url) {
  const [dataUrl, setDataUrl] = useState(qrCache[url] || '');
  useEffect(() => {
    if (!url) { setDataUrl(''); return; }
    if (qrCache[url]) { setDataUrl(qrCache[url]); return; }
    QRCode.toDataURL(url, { width: 120, margin: 0, errorCorrectionLevel: 'M' })
      .then(d => { qrCache[url] = d; setDataUrl(d); })
      .catch(() => setDataUrl(''));
  }, [url]);
  return dataUrl;
}

function LabelCell({ label, fontScale = 1 }) {
  const brand = label.manufacturer?.trim() || '';
  const code = label.code?.trim() || '';
  const product = label.product?.trim() || '';
  const description = label.description?.trim() || '';
  const price = label.price?.trim() || '';
  const logoUrl = label.logoUrl?.trim() || '/jaquar-logo.png';
  const productUrl = label.productUrl?.trim() || '';
  const qrDataUrl = useQRCode(productUrl);
  const s = (pt) => `${pt * fontScale}pt`;
  const B = '0.2mm solid #222';

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
        padding: '2mm', overflow: 'hidden',
      }}>
        {logoUrl ? (
          <img src={logoUrl} alt={brand} crossOrigin="anonymous" style={{
            maxWidth: '100%', maxHeight: '100%',
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
        justifyContent: 'center', padding: '1.5mm 2.5mm',
        overflow: 'hidden', minWidth: 0, gap: '0.8mm',
      }}>
        {code && (
          <div style={{ display: 'flex', alignItems: 'baseline', fontSize: s(6.5), lineHeight: 1.25, flexShrink: 0 }}>
            <span style={{ fontWeight: 800, flexShrink: 0, minWidth: '18mm' }}>Product Code</span>
            <span style={{ fontWeight: 800, flexShrink: 0, margin: '0 1mm' }}>:</span>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{code}</span>
          </div>
        )}

        {product && (
          <div style={{ display: 'flex', fontSize: s(6), lineHeight: 1.25, flexShrink: 0 }}>
            <span style={{ fontWeight: 800, flexShrink: 0, minWidth: '18mm', fontSize: s(6.5) }}>Product Name</span>
            <span style={{ fontWeight: 800, flexShrink: 0, margin: '0 1mm', fontSize: s(6.5) }}>:</span>
            <span style={{
              fontWeight: 600, textTransform: 'uppercase', wordBreak: 'break-word',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              textOverflow: 'ellipsis',
            }}>
              {product}
            </span>
          </div>
        )}

        {description && (
          <div style={{ display: 'flex', fontSize: s(5.5), lineHeight: 1.2, flexShrink: 0 }}>
            <span style={{ fontWeight: 800, flexShrink: 0, minWidth: '18mm', fontSize: s(6.5) }}>Product Desc</span>
            <span style={{ fontWeight: 800, flexShrink: 0, margin: '0 1mm', fontSize: s(6.5) }}>:</span>
            <span style={{
              fontWeight: 500, wordBreak: 'break-word',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              textOverflow: 'ellipsis',
            }}>
              {description}
            </span>
          </div>
        )}

        {price && (
          <div style={{ display: 'flex', alignItems: 'baseline', fontSize: s(6.5), lineHeight: 1.25, flexShrink: 0 }}>
            <span style={{ fontWeight: 800, flexShrink: 0, minWidth: '18mm' }}>Product Price</span>
            <span style={{ fontWeight: 800, flexShrink: 0, margin: '0 1mm' }}>:</span>
            <span style={{ fontWeight: 900, fontSize: s(8) }}>
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
}

export default function LabelSheet({ labels, extraTopMargin = 0, fontScale = 1 }) {
  const safeLabels = Array.from({ length: 12 }, (_, i) => labels[i] || {});
  return (
    <div
      className="sheet print-sheet"
      style={extraTopMargin !== 0 ? { paddingTop: `${7 + extraTopMargin}mm`, paddingBottom: `${7 - extraTopMargin}mm` } : undefined}
    >
      {safeLabels.map((label, i) => (
        <LabelCell key={i} label={label} fontScale={fontScale} />
      ))}
    </div>
  );
}
