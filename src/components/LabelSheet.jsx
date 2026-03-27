import { QRCodeSVG } from 'qrcode.react';

const displayVal = (val) => (val?.trim() ? val : '______');

function LabelCell({ label }) {
  const brandName = label.manufacturer?.trim()
    ? label.manufacturer.trim().split(/\s+/)[0].toUpperCase()
    : 'BRAND';

  const qrValue = label.code?.trim() || label.product?.trim() || 'N/A';

  return (
    <div className="label">
      {/* Row 1: Brand + Code | QR */}
      <div className="label-row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <span className="label-brand">
            {label.manufacturer?.trim() ? brandName : (
              <span className="label-empty">BRAND</span>
            )}
          </span>
          {label.code?.trim() && (
            <span style={{ fontSize: '6.5pt', marginLeft: '2mm', color: '#555' }}>
              #{label.code}
            </span>
          )}
        </div>
        <QRCodeSVG
          value={qrValue}
          size={30}
          style={{ flexShrink: 0 }}
        />
      </div>

      {/* Row 2: Product name */}
      <div className="label-row" style={{ justifyContent: 'center' }}>
        {label.product?.trim() ? (
          <span className="label-product">{label.product}</span>
        ) : (
          <span className="label-product label-empty">______</span>
        )}
      </div>

      {/* Row 3: Size | Qty | MRP */}
      <div className="label-row">
        <div className="label-field">
          <span style={{ color: '#666' }}>Size: </span>
          <span className="label-field-value">{displayVal(label.size)}</span>
        </div>
        <div className="label-field" style={{ textAlign: 'center' }}>
          <span style={{ color: '#666' }}>Qty: </span>
          <span className="label-field-value">{displayVal(label.qty)}</span>
        </div>
        <div className="label-field" style={{ textAlign: 'right' }}>
          <span style={{ color: '#666' }}>MRP: </span>
          <span className="label-field-value">
            {label.price?.trim() ? `₹${label.price}` : '______'}
          </span>
        </div>
      </div>

      {/* Row 4: Manufacturer */}
      <div className="label-row" style={{ borderBottom: 'none' }}>
        {label.manufacturer?.trim() ? (
          <span className="label-manufacturer">{label.manufacturer}</span>
        ) : (
          <span className="label-manufacturer label-empty">______</span>
        )}
      </div>
    </div>
  );
}

export default function LabelSheet({ labels, extraTopMargin = 0 }) {
  // Always render exactly 12 labels (pad with empty if needed)
  const safeLabels = Array.from({ length: 12 }, (_, i) => labels[i] || {});
  return (
    <div
      className="sheet print-sheet"
      style={extraTopMargin !== 0 ? { paddingTop: `${4.5 + extraTopMargin}mm`, paddingBottom: `${4.5 - extraTopMargin}mm` } : undefined}
    >
      {safeLabels.map((label, i) => (
        <LabelCell key={i} label={label} />
      ))}
    </div>
  );
}
