import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { animate as animeAnimate, createTimeline, stagger } from 'animejs';

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

/* ─── Features data ──────────────────────────────────────────────────── */
const FEATURES = [
  {
    title: 'Pixel-Perfect Print',
    body: 'A4 sheet with 2x6 grid. Each label exactly 105x48mm. Zero shifting, guaranteed alignment every time.',
    accent: '#f97316',
    icon: 'M6 3h12M6 21h12M3 6l3-3M21 6l-3-3M3 18l3 3M21 18l-3 3M3 9v6M21 9v6',
    stat: '12 Labels', sub: 'per A4 sheet',
  },
  {
    title: 'Cloud Templates',
    body: 'Save templates to Supabase. Load and reprint from any device — your data always available.',
    accent: '#7c3aed',
    icon: 'M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z',
    stat: 'Supabase', sub: 'PostgreSQL cloud',
  },
  {
    title: 'One-Click PDF',
    body: 'Download a print-ready A4 PDF instantly. Share via WhatsApp, archive, or send to any print shop.',
    accent: '#2563eb',
    icon: 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
    stat: 'Instant', sub: 'PDF export',
  },
  {
    title: 'Smart Empty Fields',
    body: 'Leave any field blank and it renders as a line for manual pen fill. Partial-fill by design.',
    accent: '#22c55e',
    icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z',
    stat: 'Auto Lines', sub: 'empty = ______',
  },
  {
    title: 'Bulk Operations',
    body: 'Fill all 12 labels at once, duplicate any label, reset individually. Batch workflows built in.',
    accent: '#f43f5e',
    icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z',
    stat: 'Bulk Fill', sub: '12 at once',
  },
  {
    title: 'Keyboard Shortcuts',
    body: 'Ctrl+P to print, Ctrl+S to save template. Built for speed — professionals who move fast.',
    accent: '#06b6d4',
    icon: 'M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z',
    stat: 'Ctrl+P', sub: 'instant print',
  },
];

const STEPS = [
  { n: '01', title: 'Login', body: 'Secure admin login with JWT. Single admin account — no public access.', icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z' },
  { n: '02', title: 'Fill Labels', body: 'Enter product name, code, price, size, qty, manufacturer for each label.', icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z' },
  { n: '03', title: 'Live Preview', body: 'See exact A4 layout in real time. What you see is what gets printed.', icon: 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
  { n: '04', title: 'Print / Export', body: 'Send to printer or export as PDF. Perfect alignment every single time.', icon: 'M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.75 19.817m.463-5.988a42.453 42.453 0 0 1 10.559 0m0 0L17.25 19.817M12 3v10.5' },
];

const SPECS = [
  { label: 'Page Size', value: 'A4 — 210x297mm' },
  { label: 'Grid Layout', value: '2 columns x 6 rows' },
  { label: 'Label Size', value: '105x48mm each' },
  { label: 'Top/Bottom Margin', value: '1mm' },
  { label: 'Side Margin', value: '0.5mm' },
  { label: 'Total Labels', value: '12 per sheet' },
];

/* ─── TiltCard ───────────────────────────────────────────────────────── */
function TiltCard({ children, style = {} }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useTransform(my, [-60, 60], [10, -10]);
  const ry = useTransform(mx, [-60, 60], [-10, 10]);
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
    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * cv.width, y: Math.random() * cv.height,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.35, dy: (Math.random() - 0.5) * 0.35,
      a: Math.random() * 0.45 + 0.1,
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
        if (d < 110) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(249,115,22,${0.055 * (1 - d / 110)})`;
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

/* ─── A4 Sheet mockup ────────────────────────────────────────────────── */
const SAMPLES = [
  { name: 'Jaquar Diverter D-450', price: '3800', size: '3/4"' },
  { name: 'Cera Wall Mixer', price: '2200', size: '1/2"' },
  { name: 'Hindware Basin Tap', price: '980', size: 'N/A' },
  { name: 'Parryware Faucet', price: '1450', size: '15mm' },
  { name: 'Kohler Shower Head', price: '5600', size: '8"' },
  { name: 'Grohe SpeedClean', price: '4200', size: 'Univ.' },
  { name: 'Marc Heater 15L', price: '6800', size: '15L' },
  { name: 'Varmora Tile', price: '45', size: '30x60' },
  { name: 'Asian Paints Apex', price: '320', size: '1L' },
  { name: 'Fevicol SH 1kg', price: '185', size: '1kg' },
  { name: 'Basmati Rice', price: '120', size: '1kg' },
  { name: 'Toor Dal Best', price: '85', size: '500g' },
];

function SheetMockup() {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 8px', width: 256, boxShadow: '0 28px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(249,115,22,0.18)' }}>
      <div style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: '4px 4px 0 0', padding: '5px 8px', marginBottom: 6, fontSize: 7, fontWeight: 700, color: 'white', letterSpacing: 0.8, textTransform: 'uppercase' }}>
        A4 Label Sheet — 12 Labels — 105x48mm
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {SAMPLES.map((d, i) => (
          <div key={i} style={{ background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 2, padding: '4px 5px 4px 7px', fontSize: 5.5, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2.5, background: '#f97316' }} />
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 6, marginBottom: 2 }}>{d.name}</div>
            <div style={{ color: '#64748b' }}>Size: {d.size}</div>
            <div style={{ color: '#ea580c', fontWeight: 700, marginTop: 1 }}>MRP Rs.{d.price}</div>
            <div style={{ color: '#94a3b8', marginTop: 1, fontSize: 5 }}>Shree Ganpati Agency</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);

  /* Hero entrance — animejs v4 correct syntax */
  useEffect(() => {
    const tl = createTimeline({ defaults: { ease: 'outExpo' } });
    tl
      .add(titleRef.current, { translateY: [60, 0], opacity: [0, 1], duration: 900 }, 200)
      .add(subtitleRef.current, { translateY: [40, 0], opacity: [0, 1], duration: 800 }, '-=600')
      .add('.hero-cta', { translateY: [30, 0], opacity: [0, 1], duration: 700, delay: stagger(80) }, '-=500')
      .add('.hero-badge', { scale: [0, 1], opacity: [0, 1], duration: 600, delay: stagger(60) }, '-=400');
  }, []);

  /* Scroll-reveal sections */
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          animeAnimate(en.target, { translateY: [40, 0], opacity: [0, 1], duration: 700, ease: 'outExpo' });
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#080d1a', color: '#f1f5f9', fontFamily: 'system-ui,-apple-system,sans-serif', overflowX: 'hidden' }}>
      <Particles />

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(8,13,26,0.75)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(249,115,22,0.1)' }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BrandMark size={30} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>Shree Ganpati Agency</div>
            <div style={{ fontSize: 9, color: '#f97316', letterSpacing: '0.12em', fontWeight: 600 }}>LABEL PRINT SYSTEM</div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => e.target.style.color = '#f1f5f9'} onMouseLeave={e => e.target.style.color = '#64748b'}>Features</a>
          <a href="#specs" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}
            onMouseEnter={e => e.target.style.color = '#f1f5f9'} onMouseLeave={e => e.target.style.color = '#64748b'}>Specs</a>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/app')}
            style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}>
            Admin Login
          </motion.button>
        </motion.div>
      </nav>

      {/* HERO */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '80px 40px 60px' }}>
        <div style={{ position: 'absolute', top: '30%', left: '40%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle,rgba(249,115,22,0.07) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 80, flexWrap: 'wrap' }}>

          {/* Text side */}
          <div style={{ flex: '1 1 400px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
              {['Admin-Only Access', 'v2.0', 'A4 Precision'].map(t => (
                <span key={t} className="hero-badge" style={{ opacity: 0, padding: '4px 12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 20, fontSize: 10, color: '#fb923c', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>{t}</span>
              ))}
            </div>

            <h1 ref={titleRef} style={{ opacity: 0, fontSize: 'clamp(38px,5.5vw,70px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 20px', letterSpacing: -2.5 }}>
              Label Print<br />
              <span style={{ background: 'linear-gradient(135deg,#f97316 30%,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                System
              </span>
            </h1>

            <p ref={subtitleRef} style={{ opacity: 0, fontSize: 17, color: '#94a3b8', lineHeight: 1.75, maxWidth: 460, margin: '0 0 40px' }}>
              Precision A4 label printing for Shree Ganpati Agency. 12 labels per sheet at exact 105x48mm. Cloud templates, PDF export, and bulk operations — built for speed and accuracy.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <motion.button className="hero-cta" whileHover={{ scale: 1.04, boxShadow: '0 14px 40px rgba(249,115,22,0.45)' }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/app')}
                style={{ opacity: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '14px 30px', background: 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none', borderRadius: 10, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 28px rgba(249,115,22,0.32)' }}>
                <Icon d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" size={17} color="white" sw={2.2} />
                Get Started
              </motion.button>
              <motion.a className="hero-cta" href="#features" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{ opacity: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '14px 30px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#cbd5e1', fontSize: 15, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>
                View Features
              </motion.a>
            </div>

            {/* Quick stats row */}
            <div style={{ display: 'flex', gap: 32, marginTop: 48 }}>
              {[{ v: '12', l: 'Labels/Sheet' }, { v: '105x48', l: 'mm Label Size' }, { v: 'A4', l: 'Page Format' }].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#f97316', lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 4, fontWeight: 500 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sheet mockup */}
          <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', perspective: 1200 }}>
            <TiltCard>
              <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformStyle: 'preserve-3d', position: 'relative' }}>
                <SheetMockup />
                <div style={{ position: 'absolute', bottom: -24, left: '15%', right: '15%', height: 40, background: 'rgba(249,115,22,0.25)', filter: 'blur(22px)', borderRadius: '50%', pointerEvents: 'none' }} />
              </motion.div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ position: 'relative', zIndex: 1, padding: '36px 40px', background: 'rgba(249,115,22,0.04)', borderTop: '1px solid rgba(249,115,22,0.09)', borderBottom: '1px solid rgba(249,115,22,0.09)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
          {[{ v: 12, s: '', l: 'Labels Per Sheet' }, { v: 105, s: 'x48mm', l: 'Label Dimensions' }, { v: 210, s: 'x297mm', l: 'A4 Page Size' }, { v: 100, s: '%', l: 'Print Accuracy' }].map((item, i) => (
            <motion.div key={i} whileHover={{ scale: 1.06 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(26px,3vw,40px)', fontWeight: 900, color: '#f97316', lineHeight: 1 }}>
                <Counter target={item.v} suffix={item.s} />
              </div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 6, fontWeight: 600, letterSpacing: 0.4 }}>{item.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '110px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" style={{ opacity: 0, textAlign: 'center', marginBottom: 70 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 20, fontSize: 10, color: '#fb923c', fontWeight: 700, letterSpacing: 1.2, marginBottom: 18, textTransform: 'uppercase' }}>
              <Icon d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" size={13} color="#fb923c" sw={2} />
              Capabilities
            </div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,50px)', fontWeight: 900, margin: 0, letterSpacing: -1.5 }}>Everything you need to print</h2>
            <p style={{ color: '#475569', fontSize: 16, marginTop: 14, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
              Built for a single purpose — precise, fast, reliable label printing with cloud backup.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 18 }}>
            {FEATURES.map((f, i) => (
              <TiltCard key={i}>
                <motion.div className="reveal"
                  whileHover={{ borderColor: `${f.accent}55`, background: `${f.accent}08` }}
                  style={{ opacity: 0, padding: 28, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.025)', cursor: 'default', transition: 'border-color 0.25s, background 0.25s', transformStyle: 'preserve-3d', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 13, background: `${f.accent}14`, border: `1px solid ${f.accent}2e`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: 'translateZ(8px)' }}>
                      <Icon d={f.icon} size={22} color={f.accent} sw={1.8} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#f1f5f9' }}>{f.title}</div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{f.body}</div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', background: `${f.accent}0a`, border: `1px solid ${f.accent}1e`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 17, fontWeight: 900, color: f.accent }}>{f.stat}</span>
                    <span style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>{f.sub}</span>
                  </div>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 40px', background: 'rgba(255,255,255,0.012)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="reveal" style={{ opacity: 0, textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.22)', borderRadius: 20, fontSize: 10, color: '#a78bfa', fontWeight: 700, letterSpacing: 1.2, marginBottom: 18, textTransform: 'uppercase' }}>
              <Icon d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" size={13} color="#a78bfa" sw={2} />
              Workflow
            </div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,50px)', fontWeight: 900, margin: 0, letterSpacing: -1.5 }}>How it works</h2>
            <p style={{ color: '#475569', fontSize: 16, marginTop: 14, lineHeight: 1.7 }}>Four steps from login to perfect print output.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 8, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 40, left: '6%', right: '6%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(249,115,22,0.25),transparent)', pointerEvents: 'none' }} />
            {STEPS.map((s, i) => (
              <motion.div key={i} className="reveal" whileHover={{ y: -6 }}
                style={{ opacity: 0, textAlign: 'center', padding: '0 20px', position: 'relative', zIndex: 1, transition: 'transform 0.2s' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', gap: 4 }}>
                  <Icon d={s.icon} size={22} color="#f97316" sw={1.7} />
                  <span style={{ fontSize: 9, fontWeight: 900, color: '#f97316', letterSpacing: 1 }}>{s.n}</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, color: '#f1f5f9' }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{s.body}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRINT SPECS */}
      <section id="specs" style={{ position: 'relative', zIndex: 1, padding: '110px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 80, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div className="reveal" style={{ opacity: 0 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.22)', borderRadius: 20, fontSize: 10, color: '#60a5fa', fontWeight: 700, letterSpacing: 1.2, marginBottom: 18, textTransform: 'uppercase' }}>
                <Icon d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" size={13} color="#60a5fa" sw={2} />
                Print Specs
              </div>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 900, margin: '0 0 16px', letterSpacing: -1.5 }}>
                Engineered for<br />
                <span style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  exact alignment
                </span>
              </h2>
              <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.75, maxWidth: 380 }}>
                Every dimension calculated to the millimeter. The CSS layout engine guarantees perfect physical alignment on any A4-capable printer — no adjustments needed.
              </p>
              <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
                <div style={{ padding: '14px 20px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>CSS</div>
                  <code style={{ fontSize: 11, color: '#fb923c', fontFamily: 'monospace' }}>@page {'{'} size: A4; margin: 0; {'}'}</code>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
              {SPECS.map((s, i) => (
                <motion.div key={i} className="reveal" whileHover={{ background: 'rgba(249,115,22,0.04)' }}
                  style={{ opacity: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: i < SPECS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.2s' }}>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace', letterSpacing: 0.3 }}>{s.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section style={{ position: 'relative', zIndex: 1, padding: '70px 40px', background: 'rgba(255,255,255,0.012)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="reveal" style={{ opacity: 0, fontSize: 10, color: '#334155', letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase', marginBottom: 28 }}>Built with</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Supabase', 'PostgreSQL', 'JWT Auth', 'jsPDF', 'Vercel'].map(t => (
              <motion.span key={t} className="reveal" whileHover={{ scale: 1.07, color: '#f1f5f9', borderColor: 'rgba(249,115,22,0.35)' }}
                style={{ opacity: 0, padding: '8px 18px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#64748b', fontWeight: 500, cursor: 'default', transition: 'all 0.2s' }}>
                {t}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '120px 40px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 800px 500px at 50% 50%, rgba(249,115,22,0.055) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <motion.div className="reveal" style={{ opacity: 0 }}>
            <h2 style={{ fontSize: 'clamp(34px,5vw,64px)', fontWeight: 900, margin: '0 0 18px', lineHeight: 1.08, letterSpacing: -2.5 }}>
              Ready to print<br />
              <span style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                with precision?
              </span>
            </h2>
            <p style={{ color: '#475569', fontSize: 16, marginBottom: 44, lineHeight: 1.75, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto' }}>
              Login to the admin dashboard and start printing professional labels for Shree Ganpati Agency today.
            </p>
            <motion.button
              onClick={() => navigate('/app')}
              whileHover={{ scale: 1.04, boxShadow: '0 16px 50px rgba(249,115,22,0.45)' }}
              whileTap={{ scale: 0.97 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 44px', background: 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none', borderRadius: 12, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 30px rgba(249,115,22,0.3)' }}>
              <Icon d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" size={18} color="white" sw={2.2} />
              Open Dashboard
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '24px 40px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BrandMark size={22} />
          <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>Shree Ganpati Agency — Label Print System v2.0</span>
        </div>
        <div style={{ fontSize: 11, color: '#1e293b' }}>Admin-only system. All rights reserved.</div>
      </footer>
    </div>
  );
}
