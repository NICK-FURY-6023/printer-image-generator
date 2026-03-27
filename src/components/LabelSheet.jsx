import { QRCodeSVG } from 'qrcode.react';

/* ── Jaquar-style product label layout (105×48mm) ─────────────────── */

function LabelCell({ label, fontScale = 1 }) {
  const brandName = label.manufacturer?.trim()
    ? label.manufacturer.trim().toUpperCase()
    : '';
  const brandShort = brandName ? brandName.split(/\s+/).slice(0, 3).join(' ') : '';
  const qrValue = (label.code?.trim() || label.product?.trim() || 'N/A').substring(0, 100);
  const fs = (pt) => `${(pt * fontScale).toFixed(2)}pt`;

  return (
    <div className="label">
      {/* ── Top section: Brand+QR left | Size/Qty/MRP table right ─── */}
      <div style={{ display: 'flex', width: '100%', borderBottom: '0.4mm solid #000', paddingBottom: '1mm', marginBottom: '0.8mm' }}>
        {/* Left: Brand logo + QR + code */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '1.5mm' }}>
          <QRCodeSVG value={qrValue} size={32} style={{ flexShrink: 0 }} />
          <div style={{ overflow: 'hidden', flex: 1 }}>
            {brandShort ? (
              <div style={{
                fontSize: fs(9), fontWeight: 900, lineHeight: 1.15, color: '#000',
                fontFamily: 'Arial Black, Arial, sans-serif',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {brandShort}
              </div>
            ) : (
              <div style={{ fontSize: fs(7), color: '#aaa' }}>BRAND</div>
            )}
            {label.code?.trim() && (
              <div style={{ fontSize: fs(7.5), fontWeight: 800, color: '#000', marginTop: '0.3mm' }}>
                {label.code}
              </div>
            )}
          </div>
        </div>

        {/* Right: Size / Qty / MRP table */}
        <div style={{ flexShrink: 0, marginLeft: '1mm' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: fs(7) }}>
            <thead>
              <tr>
                <th style={{ border: '0.3mm solid #000', padding: '0.3mm 1.5mm', fontWeight: 900, color: '#000', fontSize: fs(7), whiteSpace: 'nowrap' }}>Size</th>
                <th style={{ border: '0.3mm solid #000', padding: '0.3mm 1.5mm', fontWeight: 900, color: '#000', fontSize: fs(7), whiteSpace: 'nowrap' }}>Qty</th>
                <th style={{ border: '0.3mm solid #000', padding: '0.3mm 1.5mm', fontWeight: 900, color: '#000', fontSize: fs(7), whiteSpace: 'nowrap' }}>MRP (Per Piece)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '0.3mm solid #000', padding: '0.3mm 1.5mm', textAlign: 'center', fontWeight: 800, color: '#000', fontSize: fs(7.5) }}>
                  {label.size?.trim() || '----'}
                </td>
                <td style={{ border: '0.3mm solid #000', padding: '0.3mm 1.5mm', textAlign: 'center', fontWeight: 800, color: '#000', fontSize: fs(7.5) }}>
                  {label.qty?.trim() || '----'}
                </td>
                <td style={{ border: '0.3mm solid #000', padding: '0.3mm 1.5mm', textAlign: 'center', fontWeight: 900, color: '#000', fontSize: fs(9) }}>
                  {label.price?.trim() ? `₹${label.price}` : '----'}
                  {label.price?.trim() && (
                    <div style={{ fontSize: fs(5.5), fontWeight: 600, color: '#333' }}>(Incl. All Taxes)</div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Middle: Product description (large, bold, black) ──────── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        padding: '0.5mm 0', overflow: 'hidden',
      }}>
        {label.product?.trim() ? (
          <div style={{
            fontSize: fs(9), fontWeight: 900, color: '#000', lineHeight: 1.25,
            fontFamily: 'Arial Black, Arial, sans-serif',
            textTransform: 'uppercase', wordBreak: 'break-word',
          }}>
            {label.product}
          </div>
        ) : (
          <div style={{ fontSize: fs(8), color: '#bbb' }}>PRODUCT DESCRIPTION</div>
        )}
      </div>

      {/* ── Bottom: Manufacturer info ────────────────────────────── */}
      <div style={{ borderTop: '0.4mm solid #000', paddingTop: '0.8mm' }}>
        {label.manufacturer?.trim() ? (
          <div style={{
            fontSize: fs(8), fontWeight: 900, color: '#000', lineHeight: 1.2,
            fontFamily: 'Arial Black, Arial, sans-serif',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {label.manufacturer}
          </div>
        ) : (
          <div style={{ fontSize: fs(7), color: '#bbb' }}>MANUFACTURER</div>
        )}
      </div>
    </div>
  );
}

export default function LabelSheet({ labels, extraTopMargin = 0, fontScale = 1 }) {
  const safeLabels = Array.from({ length: 12 }, (_, i) => labels[i] || {});
  return (
    <div
      className="sheet print-sheet"
      style={extraTopMargin !== 0 ? { paddingTop: `${4.5 + extraTopMargin}mm`, paddingBottom: `${4.5 - extraTopMargin}mm` } : undefined}
    >
      {safeLabels.map((label, i) => (
        <LabelCell key={i} label={label} fontScale={fontScale} />
      ))}
    </div>
  );
}
