/** Generate a random mfg date 3-5 months before current date */
export function generateMfgDate() {
  const now = new Date();
  const offset = Math.floor(Math.random() * 3) + 3;
  const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}
