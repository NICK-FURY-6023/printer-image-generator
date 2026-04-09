/**
 * Sheet layout configurations for A4 sticker sheets.
 *
 * layout12: 2 columns × 6 rows — 105 × 48 mm labels
 * layout18: 3 columns × 6 rows — 63.5 × 46.6 mm labels
 */

export const LAYOUTS = {
  layout12: {
    id: 'layout12',
    name: '12 Labels (2×6)',
    shortName: '2×6',
    cols: 2,
    rows: 6,
    count: 12,
    labelWidth: '105mm',
    labelHeight: '48mm',
    paddingTop: '7mm',
    paddingSide: '3.5mm',
    gap: '1mm',
    cssClass: 'sheet-12',
  },
  layout18: {
    id: 'layout18',
    name: '18 Labels (3×6)',
    shortName: '3×6',
    cols: 3,
    rows: 6,
    count: 18,
    labelWidth: '63.5mm',
    labelHeight: '46.6mm',
    paddingTop: '7.45mm',
    paddingSide: '6mm',
    gap: '0.5mm',
    cssClass: 'sheet-18',
  },
};

export const DEFAULT_LAYOUT = 'layout12';

export function getLayout(layoutId) {
  return LAYOUTS[layoutId] || LAYOUTS[DEFAULT_LAYOUT];
}

export function getLabelsPerPage(layoutId) {
  return getLayout(layoutId).count;
}
