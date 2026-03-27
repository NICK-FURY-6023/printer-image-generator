import { QRCodeSVG } from 'qrcode.react';

const displayVal = (val) => (val?.trim() ? val : '______');

/* Brand colour palette — cycles by first letter */
const BRAND_COLORS = [
  '#c2410c','#1d4ed8','#047857','#7c3aed',
  '#b45309','#0e7490','#be123c','#4338ca',
];
function brandColor(name) {
  const ch = (name || 'A').trim().toUpperCase().charCodeAt(0);
  return BRAND_COLORS[ch % BRAND_COLORS.length];
}

/* ── BrandLogo: small icon badge for top-left corner ─────────────── */
function BrandLogo({ manufacturer }) {
  const name  = manufacturer?.trim() || '';
  const label = name ? name.charAt(0).toUpperCase() : '?';
  const color = brandColor(name);

  return (
    <div style={{
      width: '9mm', height: '9mm', borderRadius: '1.5mm',
      background: color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0, marginRight: '1.5mm',
    }}>
      <span style={{
        fontSize: '7pt', fontWeight: 900, color: 'white',
        lineHeight: 1, fontFamily: 'Arial Black, Arial, sans-serif',
        letterSpacing: '-0.3px',
      }}>
        {label}
      </span>
    </div>
  );
}

function LabelCell({ label, fontScale = 1 }) {
  const brandName = label.manufacturer?.trim()
    ? label.manufacturer.trim().split(/\s+/).slice(0, 2).join(' ').toUpperCase()
    : '';
  const qrValue = (label.code?.trim() || label.product?.trim() || 'N/A').substring(0, 100);

  const fs = (pt) => `${(pt * fontScale).toFixed(2)}pt`;

  return (
    <div className="label">
      {/* Row 1: Brand Logo + Brand Name + Code | QR */}
      <div className="label-row" style={{ alignItems: 'center', paddingBottom: '0.8mm' }}>
        <BrandLogo manufacturer={label.manufacturer} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {brandName ? (
            <div style={{ fontSize: fs(8.5), fontWeight: 800, lineHeight: 1.1, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {brandName}
            </div>
          ) : (
            <div style={{ fontSize: fs(7.5), color: '#bbb', letterSpacing: 1 }}>BRAND</div>
          )}
          {label.code?.trim() && (
            <div style={{ fontSize: fs(6), color: '#666', lineHeight: 1 }}>
              #{label.code}
            </div>
          )}
        </div>
        <QRCodeSVG value={qrValue} size={28} style={{ flexShrink: 0, marginLeft: '1mm' }} />
      </div>

      {/* Row 2: Product name */}
      <div className="label-row" style={{ justifyContent: 'center', padding: '0.5mm 0' }}>
        {label.product?.trim() ? (
          <span style={{ fontSize: fs(8.5), fontWeight: 700, textAlign: 'center' }}>{label.product}</span>
        ) : (
          <span className="label-empty" style={{ fontSize: fs(8.5), fontWeight: 700, textAlign: 'center' }}>______</span>
        )}
      </div>

      {/* Row 3: Size | Qty | MRP */}
      <div className="label-row">
        <div className="label-field" style={{ fontSize: fs(7) }}>
          <span style={{ color: '#666' }}>Size: </span>
          <span className="label-field-value">{displayVal(label.size)}</span>
        </div>
        <div className="label-field" style={{ textAlign: 'center', fontSize: fs(7) }}>
          <span style={{ color: '#666' }}>Qty: </span>
          <span className="label-field-value">{displayVal(label.qty)}</span>
        </div>
        <div className="label-field" style={{ textAlign: 'right', fontSize: fs(7) }}>
          <span style={{ color: '#666' }}>MRP: </span>
          <span className="label-field-value">
            {label.price?.trim() ? `₹${label.price}` : '______'}
          </span>
        </div>
      </div>

      {/* Row 4: Manufacturer */}
      <div className="label-row" style={{ borderBottom: 'none' }}>
        {label.manufacturer?.trim() ? (
          <span className="label-manufacturer" style={{ fontSize: fs(6.5) }}>{label.manufacturer}</span>
        ) : (
          <span className="label-empty label-manufacturer" style={{ fontSize: fs(6.5) }}>______</span>
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
