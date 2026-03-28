import { QRCodeSVG } from 'qrcode.react';

/*
 * Jaquar-style product label — 105mm × 48mm
 * ┌──────┬──────────────────────────────────────────────────────┐
 * │      │ [JJ] Jaquar        │ Size │ Qty │ ₹ 3800.00        │
 * │  V   │                    │------│-----│ Incl.Of All Taxes │
 * │  E   │                    │      │     │ 314786342         │
 * │  R   ├────────────────────┴──────┴─────┴──────────────────┤
 * │  T   │ CONCEALED BODY FOR SINGLE LEVER HIGH FLOW   [QR]  │
 * │  I   │ DIVERTER WITH BUTTON ASSEMBLY, BUT WITHOUT         │
 * │  C   │ EXPOSED PARTS                                      │
 * │  A   ├────────────────────────────────────────────────────┤
 * │  L   │ Manufactured By: 1QAC1G3    Mth/Yr of Mfg: 2025  │
 * │      ├────────────────────────────────────────────────────┤
 * │  C   │ JAQUAR & CO. PVT. LTD.            MADE IN INDIA   │
 * │  O   │ REGD. OFFICE: ... MFG AT: ...                     │
 * │  D   ├────────────────────────────────────────────────────┤
 * │  E   │ For Complaints... Email: ... Phone: ...            │
 * └──────┴────────────────────────────────────────────────────┘
 */

function LabelCell({ label, fontScale = 1 }) {
  const brand = label.manufacturer?.trim() || '';
  const code = label.code?.trim() || '';
  const qrVal = (code || label.product?.trim() || 'N/A').substring(0, 100);
  const s = (pt) => `${pt * fontScale}pt`;
  const B = '0.2mm solid #222';
  const logoUrl = label.logoUrl?.trim() || '';

  return (
    <div style={{
      width: '100%', height: '100%',
      border: B, boxSizing: 'border-box',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#000', display: 'flex', overflow: 'hidden',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    }}>

      {/* ── LEFT VERTICAL STRIP — model code rotated ── */}
      <div style={{
        width: '5.5mm', borderRight: B,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden',
      }}>
        {code && (
          <div style={{
            transform: 'rotate(-90deg)', whiteSpace: 'nowrap',
            fontSize: s(6), fontWeight: 900, letterSpacing: '0.3px',
          }}>{code}</div>
        )}
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{
        flex: '1 1 auto', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', minWidth: 0,
      }}>

        {/* ROW 1 — Brand | Size/Qty table | Price + Serial */}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          borderBottom: B, flexShrink: 0,
        }}>
          {/* Brand logo + name */}
          <div style={{
            flex: '1 1 auto', display: 'flex', alignItems: 'center',
            padding: '0.5mm 1.5mm', minWidth: 0, overflow: 'hidden', gap: '1.2mm',
          }}>
            {logoUrl && (
              <img src={logoUrl} alt="" style={{
                height: '5mm', width: 'auto', maxWidth: '12mm',
                objectFit: 'contain', flexShrink: 0,
              }} />
            )}
            <span style={{
              fontSize: s(11), fontWeight: 700, fontStyle: 'italic',
              fontFamily: 'Georgia, "Times New Roman", serif',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              lineHeight: 1.1,
            }}>
              {brand || <span style={{ color: '#ccc', fontStyle: 'normal', fontWeight: 400, fontSize: s(8) }}>Brand</span>}
            </span>
          </div>

          {/* Size + Qty mini-table */}
          <table style={{ borderCollapse: 'collapse', flexShrink: 0 }}>
            <thead>
              <tr>
                {['Size', 'Qty'].map(h => (
                  <th key={h} style={{
                    border: B, padding: '0.2mm 1.2mm',
                    fontSize: s(5), fontWeight: 900, textAlign: 'center',
                    whiteSpace: 'nowrap', lineHeight: 1.1,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{
                  border: B, padding: '0.2mm 1.2mm',
                  fontSize: s(5.5), fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap',
                }}>{label.size?.trim() || '----'}</td>
                <td style={{
                  border: B, padding: '0.2mm 1.2mm',
                  fontSize: s(5.5), fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap',
                }}>{label.qty?.trim() || '----'}</td>
              </tr>
            </tbody>
          </table>

          {/* Price + Serial column */}
          <div style={{
            borderLeft: B, display: 'flex', flexDirection: 'column',
            alignItems: 'flex-end', justifyContent: 'center',
            padding: '0.5mm 1.5mm', flexShrink: 0, minWidth: '20mm',
          }}>
            <div style={{ fontSize: s(8.5), fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap' }}>
              {label.price?.trim() ? `\u20B9 ${label.price}` : '----'}
            </div>
            {label.price?.trim() && (
              <div style={{ fontSize: s(3.2), color: '#333', whiteSpace: 'nowrap', lineHeight: 1, marginTop: '0.2mm' }}>
                Incl. Of All Taxes
              </div>
            )}
            {label.serialNo?.trim() && (
              <div style={{ fontSize: s(5), fontWeight: 800, lineHeight: 1, marginTop: '0.3mm' }}>
                {label.serialNo}
              </div>
            )}
          </div>
        </div>

        {/* ROW 2 — Product description + QR code */}
        <div style={{
          flex: '1 1 auto', display: 'flex', alignItems: 'flex-start',
          padding: '0.5mm 1.5mm', borderBottom: B,
          overflow: 'hidden', minHeight: 0,
        }}>
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            {label.product?.trim() ? (
              <div style={{
                fontSize: s(6.5), fontWeight: 900, lineHeight: 1.2,
                textTransform: 'uppercase', wordBreak: 'break-word',
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
              }}>{label.product}</div>
            ) : (
              <div style={{ fontSize: s(6), color: '#ccc' }}>PRODUCT DESCRIPTION</div>
            )}
          </div>
          <div style={{ flexShrink: 0, marginLeft: '1.5mm' }}>
            <QRCodeSVG value={qrVal} size={30}
              style={{ width: '8.5mm', height: '8.5mm', display: 'block' }} />
          </div>
        </div>

        {/* ROW 3 — Manufactured By + Mfg Date */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          padding: '0.3mm 1.5mm', borderBottom: B, flexShrink: 0,
          fontSize: s(4.5), lineHeight: 1.2,
        }}>
          <span>
            <span style={{ fontWeight: 800 }}>Manufactured By:</span>{' '}
            <span style={{ fontWeight: 700 }}>{label.mfgCode?.trim() || '----'}</span>
          </span>
          <span>
            <span style={{ fontWeight: 800 }}>Mth/Yr of Mfg:</span>{' '}
            {label.mfgDate?.trim() || '----'}
          </span>
        </div>

        {/* ROW 4 — Company name + MADE IN + Addresses */}
        <div style={{
          padding: '0.3mm 1.5mm', borderBottom: B, flexShrink: 0, overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{
              fontSize: s(5.5), fontWeight: 900, textTransform: 'uppercase',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: '1 1 auto', minWidth: 0,
            }}>{brand ? brand.toUpperCase() : 'COMPANY NAME'}</span>
            <span style={{
              fontSize: s(4.5), fontWeight: 900, whiteSpace: 'nowrap',
              flexShrink: 0, marginLeft: '2mm',
            }}>MADE IN {(label.madeIn?.trim() || 'INDIA').toUpperCase()}</span>
          </div>
          {(label.regdAddress?.trim() || label.mfgAddress?.trim()) && (
            <div style={{
              fontSize: s(3), color: '#111', lineHeight: 1.15,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              marginTop: '0.1mm',
            }}>
              {label.regdAddress?.trim() && <span>REGD. OFFICE: {label.regdAddress} </span>}
              {label.mfgAddress?.trim() && <span>MFG. AT: {label.mfgAddress}</span>}
            </div>
          )}
        </div>

        {/* ROW 5 — Complaints / Contact footer */}
        <div style={{
          padding: '0.2mm 1.5mm', flexShrink: 0, overflow: 'hidden',
          fontSize: s(3.2), lineHeight: 1.2, color: '#111',
        }}>
          <div>For Complaints Contact : Mgr. Customer Care, at Regd. Off. Address</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>E-mail : {label.email?.trim() || '----'}</span>
            <span>{'\u260E'} {label.phone?.trim() || '----'}{label.phone?.trim() ? ' (Toll Free)' : ''}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LabelSheet({ labels, extraTopMargin = 0, fontScale = 1 }) {
  const safeLabels = Array.from({ length: 12 }, (_, i) => labels[i] || {});
  return (
    <div
      className="sheet print-sheet"
      style={extraTopMargin !== 0 ? { paddingTop: `${3.75 + extraTopMargin}mm`, paddingBottom: `${3.75 - extraTopMargin}mm` } : undefined}
    >
      {safeLabels.map((label, i) => (
        <LabelCell key={i} label={label} fontScale={fontScale} />
      ))}
    </div>
  );
}
