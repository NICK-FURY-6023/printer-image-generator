import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { animate as animeAnimate } from 'animejs';

/* ─── Icon ────────────────────────────────────────────────────────────── */
function Icon({ d, size = 20, color = 'currentColor', sw = 1.75 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

/* ─── Brand mark ─────────────────────────────────────────────────────── */
function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="url(#bm-grad)" />
      <defs>
        <linearGradient id="bm-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      <path d="M10 22 L16 10 L22 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 18 L20 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Data ────────────────────────────────────────────────────────────── */
const CATEGORIES = [
  {
    title: 'Label Editor',
    desc: '12 labels per A4 sheet with pixel-perfect alignment. Search 4,600+ Jaquar products instantly.',
    icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z',
    gradient: 'linear-gradient(135deg, #f97316, #dc2626)',
    stat: '4,600+', statLabel: 'Products',
  },
  {
    title: 'Vector PDF',
    desc: 'Native jsPDF engine renders crisp vector text. No screenshots, no blurry labels. 100-500KB output.',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z',
    gradient: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    stat: '500KB', statLabel: 'Max Size',
  },
  {
    title: 'Cloud Templates',
    desc: 'Save label configurations to Supabase cloud. Load from any device. Auto-named history tracking.',
    icon: 'M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z',
    gradient: 'linear-gradient(135deg, #7c3aed, #ec4899)',
    stat: '\u221E', statLabel: 'Templates',
  },
  {
    title: 'Multi-Page',
    desc: 'Create unlimited pages of labels. Print all pages in one go. Duplicate entire pages with one click.',
    icon: 'M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L21.75 16.5 12 21.75 2.25 16.5l4.179-2.25m0 0 5.571 3 5.571-3',
    gradient: 'linear-gradient(135deg, #06b6d4, #2563eb)',
    stat: '\u221E', statLabel: 'Pages',
  },
];

const FEATURES = [
  { title: 'Jaquar Search', body: 'Type any product code or name \u2014 instant results from 4,600+ Jaquar products with exact MRP pricing.', accent: '#f97316', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' },
  { title: 'Auto QR Codes', body: 'Every label gets a QR code linking to the official Jaquar product page. Scan to verify pricing.', accent: '#7c3aed', icon: 'M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5Z M3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z M13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z' },
  { title: 'Bulk Operations', body: 'Fill all 12 labels at once. Duplicate any label to all. Apply brand, manufacturer across the board.', accent: '#22c55e', icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z' },
  { title: 'Ctrl+P Print', body: 'Native browser print via React Portal. Perfect alignment every time. Zero white-page issues.', accent: '#2563eb', icon: 'M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.75 19.817m.463-5.988a42.453 42.453 0 0 1 10.559 0m0 0L17.25 19.817M12 3v10.5' },
  { title: 'Smart Empty Fields', body: 'Leave fields blank \u2014 they render as lines for handwriting. Partial-fill labels by design.', accent: '#f43f5e', icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z' },
  { title: 'History & Names', body: 'Every print session auto-named from product codes. Format: "Jaquar ALD-079N +5 (2pg)".', accent: '#06b6d4', icon: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
];

const STEPS = [
  { n: '01', title: 'Login', body: 'Secure JWT admin login. Single-admin system.', icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z' },
  { n: '02', title: 'Search & Fill', body: 'Search Jaquar products or type manually. Auto-fill all details.', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' },
  { n: '03', title: 'Preview', body: 'Live A4 preview. See exactly what gets printed.', icon: 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
  { n: '04', title: 'Print / Export', body: 'Ctrl+P or download vector PDF. Perfect every time.', icon: 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3' },
];

const SPECS = [
  { label: 'Page Size', value: 'A4 \u2014 210\u00D7297mm' },
  { label: 'Grid Layout', value: '2 columns \u00D7 6 rows' },
  { label: 'Label Size', value: '105\u00D748mm each' },
  { label: 'PDF Engine', value: 'Native jsPDF vector' },
  { label: 'Jaquar Products', value: '4,600+ preloaded' },
  { label: 'Total Labels', value: '12 per sheet' },
];

const TECH = ['React 18', 'Vite 6', 'Tailwind CSS 4', 'Framer Motion', 'jsPDF', 'Supabase', 'JWT Auth', 'Vercel'];

/* ─── TiltCard ───────────────────────────────────────────────────────── */
function TiltCard({ children, style = {}, intensity = 10 }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useTransform(my, [-60, 60], [intensity, -intensity]);
  const ry = useTransform(mx, [-60, 60], [-intensity, intensity]);
  const srx = useSpring(rx, { stiffness: 280, damping: 28 });
  const sry = useSpring(ry, { stiffness: 280, damping: 28 });

  return (
    <motion.div
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left - r.width / 2);
        my.set(e.clientY - r.top - r.height / 2);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d', ...style }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated counter ───────────────────────────────────────────────── */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const obj = { v: 0 };
        animeAnimate(obj, {
          v: target,
          duration: 1400,
          ease: 'outExpo',
          onUpdate: () => setVal(Math.round(obj.v)),
        });
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Particle canvas ────────────────────────────────────────────────── */
function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * cv.width, y: Math.random() * cv.height,
      r: Math.random() * 1.5 + 0.3,
      dx: (Math.random() - 0.5) * 0.25, dy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.35 + 0.05,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,115,22,${p.a})`; ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > cv.width) p.dx *= -1;
        if (p.y < 0 || p.y > cv.height) p.dy *= -1;
      });
      pts.forEach((a, i) => pts.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 100) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(249,115,22,${0.04 * (1 - d / 100)})`;
          ctx.lineWidth = 0.5; ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

/* ─── Reveal wrapper ─────────────────────────────────────────────────── */
function Reveal({ children, delay = 0, direction = 'up' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const dirs = { up: { y: 50 }, down: { y: -50 }, left: { x: 60 }, right: { x: -60 } };
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, ...dirs[direction] }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ─── Section divider ────────────────────────────────────────────────── */
function Divider({ color = 'rgba(249,115,22,0.15)' }) {
  return <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, maxWidth: 1200, margin: '0 auto' }} />;
}

/* ─── Label mockup (mini A4 sheet) ───────────────────────────────────── */
const SAMPLES = [
  { name: 'Jaquar Diverter D-450', code: 'ALD-CHR-079N', price: '3,800' },
  { name: 'Jaquar Florentine', code: 'FLR-CHR-5167', price: '2,590' },
  { name: 'Jaquar Opal Prime', code: 'OPP-CHR-15051', price: '1,980' },
  { name: 'Jaquar Arc Basin', code: 'ARC-CHR-33011', price: '4,200' },
  { name: 'Jaquar Lyric Shower', code: 'LYR-CHR-38783', price: '5,600' },
  { name: 'Jaquar Continental', code: 'CON-CHR-347KN', price: '3,150' },
  { name: 'Jaquar Kubix Prime', code: 'KUB-CHR-35251', price: '6,800' },
  { name: 'Jaquar Aria Mixer', code: 'ARI-CHR-39801', price: '2,450' },
  { name: 'Jaquar Fonte', code: 'FON-CHR-40065', price: '3,950' },
  { name: 'Jaquar Solo', code: 'SOL-CHR-6023N', price: '1,320' },
  { name: 'Jaquar Vignette', code: 'VGN-CHR-81631', price: '7,200' },
  { name: 'Jaquar Alive', code: 'ALI-CHR-85801', price: '4,500' },
];

function SheetMockup() {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 10px', width: 280, boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08), 0 0 60px rgba(249,115,22,0.08)' }}>
      <div style={{ background: 'linear-gradient(135deg,#f97316,#c2410c)', borderRadius: '5px 5px 0 0', padding: '5px 10px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 7, fontWeight: 800, color: 'white', letterSpacing: 1, textTransform: 'uppercase' }}>Shree Ganpati Agency</span>
        <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.7)' }}>A4 Sheet</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {SAMPLES.map((d, i) => (
          <div key={i} style={{ background: '#fafafa', border: '0.5px solid #e2e8f0', borderRadius: 3, padding: '4px 5px 4px 8px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg, #f97316, #ea580c)' }} />
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 5.5, marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.code}</div>
            <div style={{ color: '#475569', fontSize: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
            <div style={{ color: '#ea580c', fontWeight: 800, marginTop: 1, fontSize: 5.5 }}>\u20B9{d.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Jaquar search mockup ───────────────────────────────────────────── */
function SearchMockup() {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const mockResults = [
    { code: 'ALD-CHR-079N', name: 'Jaquar Alive Diverter', price: '\u20B93,800' },
    { code: 'ALD-CHR-079B', name: 'Jaquar Alive Diverter Matt', price: '\u20B94,200' },
    { code: 'ALD-BLK-079N', name: 'Jaquar Alive Black Diverter', price: '\u20B95,100' },
  ];

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery('ALD');
      setTimeout(() => setShowResults(true), 400);
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: 380, background: '#0f172a', borderRadius: 16, padding: 20, border: '1px solid #1e293b', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#f97316', letterSpacing: '0.12em', marginBottom: 12, textTransform: 'uppercase' }}>Jaquar Product Search</div>
      <div style={{ position: 'relative' }}>
        <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 14px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" size={14} color="#475569" />
          <span style={{ fontSize: 13, color: query ? '#f1f5f9' : '#475569', fontFamily: 'monospace' }}>{query || 'Search by code or name...'}</span>
          {query && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '2px 8px', borderRadius: 6 }}>3 results</span>}
        </div>
        <AnimatePresence>
          {showResults && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, background: '#1e293b', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden', zIndex: 10 }}>
              {mockResults.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  style={{ padding: '10px 14px', borderBottom: i < 2 ? '1px solid #0f172a' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', fontFamily: 'monospace' }}>{r.code}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{r.name}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#22c55e' }}>{r.price}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  LANDING PAGE                                                         */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState('');

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const sections = ['categories', 'features', 'workflow', 'specs'];
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 200) { setActiveNav(id); break; }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#050a18', color: '#f1f5f9', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflowX: 'hidden' }}>
      <Particles />

      {/* ════════════ NAV ════════════ */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64,
          padding: '0 clamp(20px, 4vw, 48px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: scrolled ? 'rgba(5,10,24,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(1.8)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(249,115,22,0.08)' : '1px solid transparent',
          transition: 'background 0.4s, border-color 0.4s, backdrop-filter 0.4s',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandMark size={34} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2, letterSpacing: -0.3 }}>Shree Ganpati Agency</div>
            <div style={{ fontSize: 9, color: '#f97316', letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase' }}>Label Print System</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {[
            { label: 'Products', href: '#categories' },
            { label: 'Features', href: '#features' },
            { label: 'Workflow', href: '#workflow' },
            { label: 'Specs', href: '#specs' },
          ].map(link => {
            const id = link.href.slice(1);
            return (
              <a key={id} href={link.href} style={{
                fontSize: 13, textDecoration: 'none', fontWeight: 600, letterSpacing: 0.2,
                color: activeNav === id ? '#f97316' : '#64748b',
                borderBottom: activeNav === id ? '2px solid #f97316' : '2px solid transparent',
                paddingBottom: 2,
                transition: 'color 0.2s, border-color 0.2s',
              }}
                onMouseEnter={e => { e.target.style.color = '#f1f5f9'; }}
                onMouseLeave={e => { e.target.style.color = activeNav === id ? '#f97316' : '#64748b'; }}>
                {link.label}
              </a>
            );
          })}
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/app')}
            style={{
              padding: '9px 24px', background: 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none',
              borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(249,115,22,0.3)', letterSpacing: 0.3,
            }}>
            Open Dashboard \u2192
          </motion.button>
        </div>
      </motion.nav>

      {/* ════════════ HERO ════════════ */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px clamp(20px, 4vw, 48px) 60px' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '15%', left: '30%', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', top: '50%', right: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.04) 0%, transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.03) 0%, transparent 70%)' }} />
        </div>

        <div style={{ maxWidth: 1300, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 'clamp(40px, 6vw, 100px)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 440px', position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
                {[
                  { label: 'Jaquar Integrated', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', color: '#fb923c' },
                  { label: 'v3.0', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)', color: '#a78bfa' },
                  { label: '4,600+ Products', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', color: '#4ade80' },
                ].map(b => (
                  <span key={b.label} style={{ padding: '5px 14px', background: b.bg, border: `1px solid ${b.border}`, borderRadius: 20, fontSize: 10, color: b.color, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{b.label}</span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h1 style={{ fontSize: 'clamp(42px, 6vw, 76px)', fontWeight: 900, lineHeight: 1.02, margin: '0 0 24px', letterSpacing: -3 }}>
                Print Labels<br />
                <span style={{ background: 'linear-gradient(135deg, #f97316 20%, #fbbf24 50%, #f97316 80%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 3s linear infinite' }}>
                  Like a Pro
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.8, maxWidth: 480, margin: '0 0 40px' }}>
                Professional A4 label printing for <strong style={{ color: '#f1f5f9' }}>Shree Ganpati Agency</strong>.
                12 labels per sheet. Integrated with <strong style={{ color: '#f97316' }}>4,600+ Jaquar products</strong> for instant pricing and details.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <motion.button whileHover={{ scale: 1.04, boxShadow: '0 20px 50px rgba(249,115,22,0.4)' }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/app')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 36px', background: 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none', borderRadius: 14, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(249,115,22,0.3)', letterSpacing: 0.3 }}>
                  Get Started
                  <Icon d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" size={18} color="white" sw={2.5} />
                </motion.button>
                <motion.a href="#categories" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 32px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: '#cbd5e1', fontSize: 16, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', backdropFilter: 'blur(8px)' }}>
                  Explore Features
                </motion.a>
              </div>
            </Reveal>

            <Reveal delay={0.4}>
              <div style={{ display: 'flex', gap: 40, marginTop: 56, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { v: '4,600+', l: 'Jaquar Products', c: '#f97316' },
                  { v: '12', l: 'Labels/Sheet', c: '#7c3aed' },
                  { v: '<500KB', l: 'PDF Size', c: '#22c55e' },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 6, fontWeight: 500 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', perspective: 1200 }}>
            <Reveal direction="right" delay={0.3}>
              <TiltCard>
                <motion.div animate={{ y: [0, -16, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformStyle: 'preserve-3d', position: 'relative' }}>
                  <SheetMockup />
                  <div style={{ position: 'absolute', bottom: -30, left: '10%', right: '10%', height: 50, background: 'rgba(249,115,22,0.2)', filter: 'blur(28px)', borderRadius: '50%', pointerEvents: 'none' }} />
                </motion.div>
              </TiltCard>
            </Reveal>
          </div>
        </div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#334155' }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Scroll</div>
          <Icon d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" size={16} color="#334155" />
        </motion.div>
      </section>

      {/* ════════════ STATS BAR ════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '40px clamp(20px, 4vw, 48px)', background: 'linear-gradient(135deg, rgba(249,115,22,0.04), rgba(124,58,237,0.02))', borderTop: '1px solid rgba(249,115,22,0.06)', borderBottom: '1px solid rgba(249,115,22,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 28 }}>
          {[
            { v: 12, s: '', l: 'Labels Per Sheet', c: '#f97316' },
            { v: 4600, s: '+', l: 'Jaquar Products', c: '#22c55e' },
            { v: 105, s: '\u00D748mm', l: 'Label Dimensions', c: '#7c3aed' },
            { v: 100, s: '%', l: 'Print Accuracy', c: '#2563eb' },
          ].map((item, i) => (
            <motion.div key={i} whileHover={{ scale: 1.06, y: -2 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 900, color: item.c, lineHeight: 1 }}>
                <Counter target={item.v} suffix={item.s} />
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 8, fontWeight: 600, letterSpacing: 0.5 }}>{item.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════ CATEGORIES ════════════ */}
      <section id="categories" style={{ position: 'relative', zIndex: 1, padding: '120px clamp(20px, 4vw, 48px)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 24, fontSize: 11, color: '#fb923c', fontWeight: 700, letterSpacing: 1.2, marginBottom: 20, textTransform: 'uppercase' }}>
                <Icon d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6Z M3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25Z M13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6Z" size={14} color="#fb923c" sw={2} />
                Product Showcase
              </div>
              <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 900, margin: 0, letterSpacing: -2 }}>Everything in One System</h2>
              <p style={{ color: '#475569', fontSize: 16, marginTop: 16, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.75 }}>
                From Jaquar product search to multi-page PDF export \u2014 a complete label printing solution built for professionals.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {CATEGORIES.map((cat, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <TiltCard intensity={6}>
                  <motion.div
                    whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.15)' }}
                    style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', cursor: 'default', transition: 'box-shadow 0.3s, transform 0.3s', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: cat.gradient, padding: '32px 28px 28px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                      <div style={{ position: 'absolute', bottom: -30, left: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, border: '1px solid rgba(255,255,255,0.2)' }}>
                        <Icon d={cat.icon} size={24} color="white" sw={1.8} />
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>{cat.title}</div>
                    </div>
                    <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
                      <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{cat.desc}</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9' }}>{cat.stat}</span>
                        <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{cat.statLabel}</span>
                      </div>
                    </div>
                  </motion.div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ════════════ JAQUAR INTEGRATION ════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '120px clamp(20px, 4vw, 48px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 80, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px' }}>
            <Reveal direction="left">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 24, fontSize: 11, color: '#fb923c', fontWeight: 700, letterSpacing: 1.2, marginBottom: 20, textTransform: 'uppercase' }}>
                <Icon d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" size={14} color="#fb923c" sw={2} />
                Jaquar Integration
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 900, margin: '0 0 20px', letterSpacing: -1.5 }}>
                Search <span style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>4,600+ Products</span>
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8, maxWidth: 420, marginBottom: 32 }}>
                Type any product code or name \u2014 get instant results with exact MRP pricing directly from <strong style={{ color: '#f1f5f9' }}>jaquar.com</strong>. Auto-fills code, name, description, price, and generates a QR code.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 360 }}>
                {[
                  { icon: '\u26A1', label: 'Instant Search', desc: 'Client-side, no API' },
                  { icon: '\uD83D\uDCB0', label: 'Exact MRP', desc: 'Official pricing' },
                  { icon: '\uD83D\uDCF1', label: 'QR Codes', desc: 'Auto-generated' },
                  { icon: '\uD83C\uDFF7\uFE0F', label: 'Auto-Fill', desc: 'All fields at once' },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{f.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{f.label}</div>
                    <div style={{ fontSize: 10, color: '#475569' }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <div style={{ flex: '1 1 340px', display: 'flex', justifyContent: 'center' }}>
            <Reveal direction="right" delay={0.2}>
              <SearchMockup />
            </Reveal>
          </div>
        </div>
      </section>

      <Divider />

      {/* ════════════ FEATURES ════════════ */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '120px clamp(20px, 4vw, 48px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 24, fontSize: 11, color: '#a78bfa', fontWeight: 700, letterSpacing: 1.2, marginBottom: 20, textTransform: 'uppercase' }}>
                <Icon d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" size={14} color="#a78bfa" sw={2} />
                Features
              </div>
              <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 900, margin: 0, letterSpacing: -2 }}>Built for Speed & Precision</h2>
              <p style={{ color: '#475569', fontSize: 16, marginTop: 16, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.75 }}>
                Every feature designed to make label printing faster, more accurate, and effortless.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <motion.div
                  whileHover={{ borderColor: `${f.accent}44`, y: -4 }}
                  style={{ padding: 28, borderRadius: 18, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)', cursor: 'default', transition: 'all 0.3s', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.accent}10`, border: `1px solid ${f.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon d={f.icon} size={20} color={f.accent} sw={1.8} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#f1f5f9', letterSpacing: -0.3 }}>{f.title}</div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{f.body}</div>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Divider color="rgba(124,58,237,0.1)" />

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section id="workflow" style={{ position: 'relative', zIndex: 1, padding: '120px clamp(20px, 4vw, 48px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 24, fontSize: 11, color: '#4ade80', fontWeight: 700, letterSpacing: 1.2, marginBottom: 20, textTransform: 'uppercase' }}>
                <Icon d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" size={14} color="#4ade80" sw={2} />
                Workflow
              </div>
              <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', fontWeight: 900, margin: 0, letterSpacing: -2 }}>Four Simple Steps</h2>
              <p style={{ color: '#475569', fontSize: 16, marginTop: 16, lineHeight: 1.75 }}>From login to perfect print output in seconds.</p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 52, left: '10%', right: '10%', height: 2, background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.2), rgba(124,58,237,0.2), transparent)', pointerEvents: 'none', borderRadius: 1 }} />
            {STEPS.map((s, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <motion.div whileHover={{ y: -8 }}
                  style={{ textAlign: 'center', padding: '0 16px', position: 'relative', zIndex: 1, cursor: 'default' }}>
                  <div style={{
                    width: 88, height: 88, borderRadius: '50%', margin: '0 auto 24px', position: 'relative',
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(124,58,237,0.04))',
                    border: '2px solid rgba(249,115,22,0.15)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}>
                    <Icon d={s.icon} size={24} color="#f97316" sw={1.7} />
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#f97316', letterSpacing: 1.5 }}>{s.n}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: '#f1f5f9', letterSpacing: -0.3 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{s.body}</div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Divider color="rgba(34,197,94,0.1)" />

      {/* ════════════ SPECS ════════════ */}
      <section id="specs" style={{ position: 'relative', zIndex: 1, padding: '120px clamp(20px, 4vw, 48px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 80, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 360px' }}>
            <Reveal direction="left">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 24, fontSize: 11, color: '#60a5fa', fontWeight: 700, letterSpacing: 1.2, marginBottom: 20, textTransform: 'uppercase' }}>
                <Icon d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" size={14} color="#60a5fa" sw={2} />
                Print Specifications
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 900, margin: '0 0 20px', letterSpacing: -1.5 }}>
                Engineered for<br />
                <span style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Exact Alignment</span>
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.8, maxWidth: 400, marginBottom: 32 }}>
                Every dimension calculated to the millimeter. CSS layout engine guarantees perfect physical alignment on any A4 printer.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ padding: '16px 22px', background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.1)', borderRadius: 12 }}>
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>CSS Rule</div>
                  <code style={{ fontSize: 12, color: '#fb923c', fontFamily: 'monospace', fontWeight: 600 }}>@page {'{'} size: A4; margin: 0 {'}'}</code>
                </div>
              </div>
            </Reveal>
          </div>

          <div style={{ flex: '1 1 340px' }}>
            <Reveal direction="right" delay={0.2}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.3)' }}>
                {SPECS.map((s, i) => (
                  <motion.div key={i} whileHover={{ background: 'rgba(249,115,22,0.03)' }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px', borderBottom: i < SPECS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.2s' }}>
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace', letterSpacing: 0.3 }}>{s.value}</span>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Divider color="rgba(37,99,235,0.1)" />

      {/* ════════════ TECH STACK ════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '80px clamp(20px, 4vw, 48px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ fontSize: 10, color: '#334155', letterSpacing: 2.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: 28 }}>Built With Modern Technology</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              {TECH.map(t => (
                <motion.span key={t}
                  whileHover={{ scale: 1.06, y: -2, color: '#f1f5f9', borderColor: 'rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.06)' }}
                  style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontSize: 13, color: '#64748b', fontWeight: 500, cursor: 'default', transition: 'all 0.2s' }}>
                  {t}
                </motion.span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════ CTA ════════════ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '140px clamp(20px, 4vw, 48px)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 900px 500px at 50% 50%, rgba(249,115,22,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Reveal>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <h2 style={{ fontSize: 'clamp(36px, 5.5vw, 68px)', fontWeight: 900, margin: '0 0 20px', lineHeight: 1.05, letterSpacing: -3 }}>
              Ready to Print<br />
              <span style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Perfect Labels?
              </span>
            </h2>
            <p style={{ color: '#475569', fontSize: 17, marginBottom: 48, lineHeight: 1.8, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              Open the admin dashboard and start printing professional labels with Jaquar product integration.
            </p>
            <motion.button
              onClick={() => navigate('/app')}
              whileHover={{ scale: 1.04, boxShadow: '0 20px 60px rgba(249,115,22,0.4)' }}
              whileTap={{ scale: 0.96 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '18px 50px', background: 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none', borderRadius: 16, color: 'white', fontSize: 17, fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 36px rgba(249,115,22,0.3)', letterSpacing: 0.3 }}>
              <Icon d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" size={20} color="white" sw={2.5} />
              Open Dashboard
            </motion.button>
          </div>
        </Reveal>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '28px clamp(20px, 4vw, 48px)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark size={24} />
            <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>Shree Ganpati Agency \u2014 Label Print System v3.0</span>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href="https://github.com/ATUL-MAHARAJ/printer-image-generator" target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: '#1e293b', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => { e.target.style.color = '#f97316'; }} onMouseLeave={e => { e.target.style.color = '#1e293b'; }}>
              GitHub
            </a>
            <span style={{ fontSize: 11, color: '#0f172a' }}>\u00A9 2025 All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
