import { QRCodeSVG } from 'qrcode.react';

/*
 * Jaquar-style product label — 105mm × 48mm
 * Layout (top→bottom):
 *   ┌─────────────────────────────────────────────────┐
 *   │  [QR] BRAND        │ Size │ Qty │ MRP(Per Piece)│
 *   │       Code#         │ ---- │ 1N  │ ₹3800.00     │
 *   ├─────────────────────┴──────┴─────┴──────────────┤
 *   │  PRODUCT DESCRIPTION TEXT IN BOLD UPPERCASE      │
 *   │  MULTI-LINE IF NEEDED                            │
 *   ├──────────────────────────────────────────────────┤
 *   │  Mfg By: CODE           Mth/Yr of Mfg: ----    │
 *   │  MANUFACTURER NAME                    MADE IN X │
 *   └──────────────────────────────────────────────────┘
 */

function LabelCell({ label, fontScale = 1 }) {
  const brand = label.manufacturer?.trim() || '';
  const brandDisplay = brand ? brand.toUpperCase().split(/\s+/).slice(0, 3).join(' ') : '';
  const qrVal = (label.code?.trim() || label.product?.trim() || 'N/A').substring(0, 100);
  const s = (pt) => (pt * fontScale) + 'pt';

  // Outer label box — all in inline styles to bypass Tailwind resets
  return (
    <div style={{
      width: '105mm', height: '48mm',
      border: '0.3mm solid #222',
      boxSizing: 'border-box',
      padding: '1.2mm 1.5mm',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#000',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      WebkitPrintColorAdjust: 'exact',
      printColorAdjust: 'exact',
      position: 'relative',
    }}>

      {/* ── ROW 1: Brand+QR left | Size/Qty/MRP table right ── height ~14mm */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: '0.3mm solid #222',
        paddingBottom: '1mm', marginBottom: '0.8mm',
        minHeight: '12mm', maxHeight: '14mm',
        flexShrink: 0,
      }}>
        {/* Left side: QR + Brand + Code */}
        <div style={{
          display: 'flex', gap: '1.5mm', alignItems: 'flex-start',
          flex: '1 1 auto', minWidth: 0, overflow: 'hidden',
        }}>
          <div style={{ flexShrink: 0, width: '10mm', height: '10mm' }}>
            <QRCodeSVG
              value={qrVal}
              size={38}
              style={{ width: '10mm', height: '10mm', display: 'block' }}
            />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden', paddingTop: '0.3mm' }}>
            {brandDisplay ? (
              <div style={{
                fontSize: s(9), fontWeight: 900, color: '#000',
                lineHeight: 1.1, whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{brandDisplay}</div>
            ) : (
              <div style={{ fontSize: s(7), color: '#bbb' }}>BRAND</div>
            )}
            {label.code?.trim() && (
              <div style={{
                fontSize: s(7), fontWeight: 800, color: '#000',
                marginTop: '0.5mm',
              }}>{label.code}</div>
            )}
          </div>
        </div>

        {/* Right side: Size/Qty/MRP table */}
        <table style={{
          borderCollapse: 'collapse', flexShrink: 0,
          marginLeft: '1mm', alignSelf: 'flex-start',
        }}>
          <thead>
            <tr>
              {['Size', 'Qty'].map(h => (
                <th key={h} style={{
                  border: '0.3mm solid #222',
                  padding: '0.4mm 1.8mm',
                  fontSize: s(6.5), fontWeight: 900, color: '#000',
                  textAlign: 'center', whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}>{h}</th>
              ))}
              <th style={{
                border: '0.3mm solid #222',
                padding: '0.4mm 1.8mm',
                fontSize: s(5.5), fontWeight: 900, color: '#000',
                textAlign: 'center', whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}>MRP (Per Piece)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{
                border: '0.3mm solid #222', padding: '0.3mm 1.8mm',
                fontSize: s(7), fontWeight: 800, color: '#000', textAlign: 'center',
              }}>{label.size?.trim() || '----'}</td>
              <td style={{
                border: '0.3mm solid #222', padding: '0.3mm 1.8mm',
                fontSize: s(7), fontWeight: 800, color: '#000', textAlign: 'center',
              }}>{label.qty?.trim() || '----'}</td>
              <td style={{
                border: '0.3mm solid #222', padding: '0.3mm 1.8mm',
                textAlign: 'center', verticalAlign: 'middle',
              }}>
                <div style={{ fontSize: s(9), fontWeight: 900, color: '#000', lineHeight: 1.1 }}>
                  {label.price?.trim() ? `₹${label.price}` : '----'}
                </div>
                {label.price?.trim() && (
                  <div style={{ fontSize: s(4.5), color: '#333', lineHeight: 1, marginTop: '0.2mm' }}>
                    (Incl. Of All Taxes)
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── ROW 2: Product description — fills remaining space ~20mm ── */}
      <div style={{
        flex: '1 1 auto',
        display: 'flex', alignItems: 'flex-start',
        overflow: 'hidden',
        padding: '0.5mm 0',
      }}>
        {label.product?.trim() ? (
          <div style={{
            fontSize: s(8.5), fontWeight: 900, color: '#000',
            lineHeight: 1.3, textTransform: 'uppercase',
            wordBreak: 'break-word',
            overflow: 'hidden',
            maxHeight: '100%',
          }}>{label.product}</div>
        ) : (
          <div style={{ fontSize: s(7), color: '#ccc' }}>PRODUCT DESCRIPTION</div>
        )}
      </div>

      {/* ── ROW 3: Manufacturer bottom bar ~10mm ── */}
      <div style={{
        borderTop: '0.3mm solid #222',
        paddingTop: '0.8mm',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Manufactured By row */}
        {label.code?.trim() && (
          <div style={{
            display: 'flex', gap: '2mm', marginBottom: '0.5mm',
            fontSize: s(5.5), color: '#222', lineHeight: 1.2,
          }}>
            <span><b style={{ fontWeight: 800 }}>Manufactured By:</b> {label.code}</span>
          </div>
        )}
        {/* Company name */}
        {brand ? (
          <div style={{
            fontSize: s(7.5), fontWeight: 900, color: '#000',
            lineHeight: 1.15, textTransform: 'uppercase',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{brand}</div>
        ) : (
          <div style={{ fontSize: s(6), color: '#ccc' }}>MANUFACTURER</div>
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
