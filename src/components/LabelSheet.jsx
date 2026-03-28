/*
 * Clean product label — 105mm × 48mm
 * ┌──────────────────────────────────────────────────┐
 * │  [J]  Jaquar                                     │
 * │──────────────────────────────────────────────────│
 * │                                                  │
 * │  Product Code  :  ALD-CHR-070N                   │
 * │  Product Name  :  CONCEALED BODY FOR SINGLE      │
 * │                    LEVER HIGH FLOW DIVERTER       │
 * │  Product Price :  ₹ 3,800.00                     │
 * │                                                  │
 * └──────────────────────────────────────────────────┘
 */

function LabelCell({ label, fontScale = 1 }) {
  const brand = label.manufacturer?.trim() || '';
  const code = label.code?.trim() || '';
  const product = label.product?.trim() || '';
  const price = label.price?.trim() || '';
  const s = (pt) => `${pt * fontScale}pt`;
  const B = '0.2mm solid #222';
  const brandInitial = brand ? brand.charAt(0).toUpperCase() : '';

  return (
    <div style={{
      width: '105mm', height: '48mm',
      border: B, boxSizing: 'border-box',
      fontFamily: 'Arial, Helvetica, sans-serif',
      color: '#000', display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
    }}>

      {/* ── BRAND HEADER ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '1.5mm 2.5mm', borderBottom: B,
        flexShrink: 0,
      }}>
        {brandInitial && (
          <div style={{
            width: '7mm', height: '7mm', borderRadius: '50%',
            border: '0.3mm solid #222', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: s(11), fontWeight: 900, flexShrink: 0,
            marginRight: '2mm', lineHeight: 1,
          }}>
            {brandInitial}
          </div>
        )}
        <span style={{
          fontSize: s(13), fontWeight: 700, fontStyle: 'italic',
          fontFamily: 'Georgia, "Times New Roman", serif',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.1,
        }}>
          {brand || <span style={{ color: '#ccc', fontStyle: 'normal', fontWeight: 400, fontSize: s(9) }}>Brand Name</span>}
        </span>
      </div>

      {/* ── PRODUCT DETAILS ── */}
      <div style={{
        flex: '1 1 auto', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '1.5mm 2.5mm',
        overflow: 'hidden', minHeight: 0, gap: '1.2mm',
      }}>
        {/* Product Code */}
        <div style={{ display: 'flex', alignItems: 'baseline', fontSize: s(7.5), lineHeight: 1.3 }}>
          <span style={{ fontWeight: 800, flexShrink: 0, minWidth: '24mm' }}>Product Code</span>
          <span style={{ fontWeight: 800, flexShrink: 0, marginRight: '1.5mm' }}>:</span>
          <span style={{ fontWeight: 700 }}>{code || '----'}</span>
        </div>

        {/* Product Name */}
        <div style={{ display: 'flex', fontSize: s(7.5), lineHeight: 1.3 }}>
          <span style={{ fontWeight: 800, flexShrink: 0, minWidth: '24mm' }}>Product Name</span>
          <span style={{ fontWeight: 800, flexShrink: 0, marginRight: '1.5mm' }}>:</span>
          <span style={{
            fontWeight: 700, textTransform: 'uppercase', wordBreak: 'break-word',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {product || '----'}
          </span>
        </div>

        {/* Product Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', fontSize: s(7.5), lineHeight: 1.3 }}>
          <span style={{ fontWeight: 800, flexShrink: 0, minWidth: '24mm' }}>Product Price</span>
          <span style={{ fontWeight: 800, flexShrink: 0, marginRight: '1.5mm' }}>:</span>
          <span style={{ fontWeight: 900, fontSize: s(9) }}>
            {price ? `\u20B9 ${price}` : '----'}
          </span>
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
      style={extraTopMargin !== 0 ? { paddingTop: `${4.5 + extraTopMargin}mm`, paddingBottom: `${4.5 - extraTopMargin}mm` } : undefined}
    >
      {safeLabels.map((label, i) => (
        <LabelCell key={i} label={label} fontScale={fontScale} />
      ))}
    </div>
  );
}
