import { QRCodeSVG } from 'qrcode.react';

/* ── Product label layout matching Jaquar-style (105×48mm) ────────── */

function LabelCell({ label, fontScale = 1 }) {
  const brand = label.manufacturer?.trim() || '';
  const brandUpper = brand.toUpperCase();
  const qrValue = (label.code?.trim() || label.product?.trim() || 'N/A').substring(0, 100);
  const fs = (pt) => `${(pt * fontScale).toFixed(2)}pt`;

  /* ── Shared cell style for table ── */
  const thStyle = {
    border: '0.3mm solid #000', padding: '0.5mm 2mm',
    fontWeight: 900, color: '#000', fontSize: fs(6.5),
    whiteSpace: 'nowrap', textAlign: 'center',
    fontFamily: 'Arial, Helvetica, sans-serif',
  };
  const tdStyle = {
    border: '0.3mm solid #000', padding: '0.5mm 2mm',
    fontWeight: 800, color: '#000', fontSize: fs(7.5),
    textAlign: 'center', fontFamily: 'Arial, Helvetica, sans-serif',
  };

  return (
    <div style={{
      width: '105mm', height: '48mm', border: '0.4mm solid #000',
      boxSizing: 'border-box', padding: '1.5mm 2mm',
      fontFamily: 'Arial, Helvetica, sans-serif', color: '#000',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    }}>

      {/* ═══ TOP ROW: Brand+QR (left)  |  Size/Qty/MRP table (right) ═══ */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', width: '100%',
        borderBottom: '0.4mm solid #000', paddingBottom: '1mm', marginBottom: '1mm',
      }}>
        {/* Left: QR + Brand + Code */}
        <div style={{ flex: 1, display: 'flex', gap: '2mm', alignItems: 'flex-start', minWidth: 0 }}>
          <QRCodeSVG value={qrValue} size={36} style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            {brand ? (
              <div style={{
                fontSize: fs(10), fontWeight: 900, color: '#000', lineHeight: 1.15,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {brandUpper.split(/\s+/).slice(0, 2).join(' ')}
              </div>
            ) : (
              <div style={{ fontSize: fs(7), color: '#aaa' }}>BRAND</div>
            )}
            {label.code?.trim() && (
              <div style={{
                fontSize: fs(8), fontWeight: 800, color: '#000',
                marginTop: '0.5mm', letterSpacing: '0.3px',
              }}>
                {label.code}
              </div>
            )}
          </div>
        </div>

        {/* Right: Size / Qty / MRP table */}
        <table style={{ borderCollapse: 'collapse', flexShrink: 0, marginLeft: '1.5mm' }}>
          <thead>
            <tr>
              <th style={thStyle}>Size</th>
              <th style={thStyle}>Qty</th>
              <th style={{ ...thStyle, fontSize: fs(6) }}>MRP (Per Piece)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>{label.size?.trim() || '----'}</td>
              <td style={tdStyle}>{label.qty?.trim() || '----'}</td>
              <td style={{ ...tdStyle, fontSize: fs(10), fontWeight: 900 }}>
                {label.price?.trim() ? (
                  <>
                    <span>₹{label.price}</span>
                    <div style={{ fontSize: fs(5), fontWeight: 600, color: '#222', marginTop: '0.2mm' }}>
                      (Incl. Of All Taxes)
                    </div>
                  </>
                ) : '----'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══ MIDDLE: Product description (large, bold, black, uppercase) ═══ */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        padding: '0.5mm 0', overflow: 'hidden',
      }}>
        {label.product?.trim() ? (
          <div style={{
            fontSize: fs(9.5), fontWeight: 900, color: '#000', lineHeight: 1.3,
            textTransform: 'uppercase', wordBreak: 'break-word',
            letterSpacing: '0.2px',
          }}>
            {label.product}
          </div>
        ) : (
          <div style={{ fontSize: fs(8), color: '#ccc', fontWeight: 700 }}>PRODUCT DESCRIPTION</div>
        )}
      </div>

      {/* ═══ BOTTOM: Manufacturer ═══ */}
      <div style={{
        borderTop: '0.4mm solid #000', paddingTop: '1mm',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {brand ? (
          <div style={{
            fontSize: fs(8.5), fontWeight: 900, color: '#000', lineHeight: 1.2,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {brand}
          </div>
        ) : (
          <div style={{ fontSize: fs(7), color: '#ccc' }}>MANUFACTURER</div>
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
