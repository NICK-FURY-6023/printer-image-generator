import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { animate, createTimeline } from 'animejs';

/* ─── Data ──────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    title: 'Pixel-Perfect Print',
    body: 'A4 sheet with 2×6 grid. Each label exactly 105×48mm. Zero shifting, guaranteed alignment every single time.',
    accent: '#f97316',
    icon: 'M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.75 19.817m.463-5.988a42.453 42.453 0 0 1 10.559 0m0 0L17.25 19.817M12 3v10.5',
    stat: '12 Labels',
    sub: 'per A4 sheet',
  },
  {
    title: 'Cloud Templates',
    body: 'Save templates to Supabase. Load and reprint from any device, anywhere — your data always with you.',
    accent: '#7c3aed',
    icon: 'M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z',
    stat: 'Supabase',
    sub: 'PostgreSQL cloud',
  },
  {
    title: 'One-Click PDF',
    body: 'Download a print-ready A4 PDF instantly. Share via WhatsApp, archive, or send to any print shop.',
    accent: '#2563eb',
    icon: 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
    stat: 'Instant',
    sub: 'PDF export',
  },
  {
    title: 'Smart Empty Fields',
    body: 'Leave any field blank — it renders as a ______ line for manual pen fill. Partial-fill by design.',
    accent: '#22c55e',
    icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125',
    stat: 'Auto Lines',
    sub: 'empty = ______',
  },
  {
    title: 'Bulk Operations',
    body: 'Fill all 12 labels at once, duplicate any label, reset individually. Batch workflows built in.',
    accent: '#f43f5e',
    icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z',
    stat: 'Bulk Fill',
    sub: '12 at once',
  },
  {
    title: 'Keyboard Shortcuts',
    body: 'Ctrl+P to print, Ctrl+S to save template. Designed for speed — professionals who move fast.',
    accent: '#06b6d4',
    icon: 'M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z',
    stat: 'Ctrl+P',
    sub: 'instant print',
  },
];

const STEPS = [
  { n: '01', title: 'Login', body: 'Secure admin login with JWT. Single admin account — no public access.' },
  { n: '02', title: 'Fill Labels', body: 'Enter product name, code, price, size, qty, manufacturer for each label.' },
  { n: '03', title: 'Live Preview', body: 'See exact A4 layout in real time. What you see is what gets printed.' },
  { n: '04', title: 'Print / Export', body: 'Send to printer or export as PDF. Perfect alignment every time.' },
];

const SPECS = [
  { label: 'Page Size', value: 'A4 — 210×297mm' },
  { label: 'Grid', value: '2 columns × 6 rows' },
  { label: 'Label Size', value: '105×48mm each' },
  { label: 'Top Margin', value: '4.5mm' },
  { label: 'Bottom Margin', value: '4.5mm' },
  { label: 'Total Labels', value: '12 per sheet' },
];

/* ─── Small reusable components ─────────────────────────────────────── */
function SVGIcon({ d, size = 22, stroke = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/* 3D tilt card using framer-motion */
function TiltCard({ children, className = '', style = {} }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [12, -12]);
  const rotateY = useTransform(x, [-60, 60], [-12, 12]);
  const springX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }
  function onLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d', ...style }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Animated counter */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        animate({ targets: { v: 0 }, v: target, duration: 1400, easing: 'easeOutExpo',
          update: (anim) => setVal(Math.round(anim.animations[0]?.currentValue ?? 0)) });
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* Floating particle canvas */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      a: Math.random() * 0.5 + 0.1,
    }));
    let raf;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,115,22,${p.a})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      // draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(249,115,22,${0.06 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />;
}

/* A4 sheet 3D mockup */
function SheetMockup() {
  const rows = 6, cols = 2;
  const labels = Array.from({ length: rows * cols }, (_, i) => i);
  const sampleData = [
    { name: 'Jaquar Diverter', price: '3800', size: '3/4"' },
    { name: 'Cera Wall Mixer', price: '2200', size: '1/2"' },
    { name: 'Hindware Basin Tap', price: '980', size: 'N/A' },
    { name: 'Parryware Faucet', price: '1450', size: '15mm' },
    { name: 'Kohler Shower', price: '5600', size: '8"' },
    { name: 'Grohe SpeedClean', price: '4200', size: 'Universal' },
    { name: 'Marc Heater 15L', price: '6800', size: '15L' },
    { name: 'Varmora Tile', price: '45', size: '30x60cm' },
    { name: 'Asian Paints Apex', price: '320', size: '1L' },
    { name: 'Fevicol SH 1kg', price: '185', size: '1kg' },
    { name: 'Basmati Rice', price: '120', size: '1kg' },
    { name: 'Toor Dal Best', price: '85', size: '500g' },
  ];
  return (
    <div style={{
      background: '#f8fafc',
      borderRadius: 8,
      padding: '10px 8px',
      width: 260,
      boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      border: '1px solid rgba(249,115,22,0.2)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {labels.map(i => {
          const d = sampleData[i] || {};
          return (
            <div key={i} style={{
              background: 'white',
              border: '0.5px solid #e2e8f0',
              borderRadius: 2,
              padding: '4px 5px',
              fontSize: 5.5,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: '#f97316', borderRadius: '2px 0 0 2px' }} />
              <div style={{ paddingLeft: 4 }}>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 6 }}>{d.name}</div>
                <div style={{ color: '#64748b', marginTop: 2 }}>Size: {d.size}</div>
                <div style={{ color: '#ea580c', fontWeight: 700, marginTop: 1 }}>MRP Rs.{d.price}</div>
                <div style={{ color: '#94a3b8', marginTop: 1, fontSize: 5 }}>Shree Ganpati Agency</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const [activeFeature, setActiveFeature] = useState(0);

  /* Anime.js hero entrance */
  useEffect(() => {
    const tl = createTimeline({ defaults: { easing: 'easeOutExpo' } });
    tl.add({
      targets: titleRef.current,
      translateY: [60, 0],
      opacity: [0, 1],
      duration: 900,
      delay: 200,
    }).add({
      targets: subtitleRef.current,
      translateY: [40, 0],
      opacity: [0, 1],
      duration: 800,
    }, '-=600').add({
      targets: '.hero-cta',
      translateY: [30, 0],
      opacity: [0, 1],
      duration: 700,
      delay: animate.stagger(80),
    }, '-=500').add({
      targets: '.hero-badge',
      scale: [0, 1],
      opacity: [0, 1],
      duration: 600,
      delay: animate.stagger(60),
    }, '-=400');
  }, []);

  /* Animate sections on scroll */
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate({
            targets: entry.target,
            translateY: [40, 0],
            opacity: [0, 1],
            duration: 700,
            easing: 'easeOutExpo',
          });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.anim-on-scroll').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  /* Feature card cycle */
  useEffect(() => {
    const id = setInterval(() => setActiveFeature(p => (p + 1) % FEATURES.length), 3200);
    return () => clearInterval(id);
  }, []);

  const S = {
    page: { minHeight: '100vh', background: '#0a0f1e', color: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' },
    nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(249,115,22,0.12)' },
  };

  return (
    <div style={S.page}>
      <ParticleCanvas />

      {/* ── NAV ── */}
      <nav style={S.nav}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>Shree Ganpati Agency</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/login')}
            style={{ padding: '8px 20px', background: 'transparent', border: '1px solid rgba(249,115,22,0.4)', borderRadius: 8, color: '#f97316', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background = 'rgba(249,115,22,0.1)'; e.target.style.borderColor = '#f97316'; }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'rgba(249,115,22,0.4)'; }}>
            Admin Login
          </button>
        </motion.div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '80px 40px 60px' }}>
        {/* radial glow */}
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '60%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 80 }}>
          {/* Left text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {['Admin-Only', 'v2.0', 'A4 Precision'].map(t => (
                <span key={t} className="hero-badge" style={{ opacity: 0, padding: '4px 12px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 20, fontSize: 11, color: '#f97316', fontWeight: 600, letterSpacing: 0.5 }}>{t}</span>
              ))}
            </div>
            <h1 ref={titleRef} style={{ opacity: 0, fontSize: 'clamp(36px,5vw,68px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 20px', letterSpacing: -2 }}>
              Label Print{' '}
              <span style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                System
              </span>
            </h1>
            <p ref={subtitleRef} style={{ opacity: 0, fontSize: 17, color: '#94a3b8', lineHeight: 1.7, maxWidth: 460, margin: '0 0 36px' }}>
              Precision A4 label printing for Shree Ganpati Agency. 12 labels per sheet at exact 105×48mm. Cloud templates, PDF export, and bulk operations — built for speed.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <motion.button
                className="hero-cta"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{ opacity: 0, padding: '14px 32px', background: 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none', borderRadius: 10, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 30px rgba(249,115,22,0.35)', letterSpacing: 0.3 }}>
                Get Started
              </motion.button>
              <motion.a
                className="hero-cta"
                href="#features"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{ opacity: 0, padding: '14px 32px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#cbd5e1', fontSize: 15, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' }}>
                View Specs
              </motion.a>
            </div>
          </div>

          {/* Right 3D mockup */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', perspective: 1000 }}>
            <TiltCard>
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformStyle: 'preserve-3d' }}>
                <SheetMockup />
                {/* Glow under card */}
                <div style={{ position: 'absolute', bottom: -20, left: '10%', right: '10%', height: 40, background: 'rgba(249,115,22,0.2)', filter: 'blur(20px)', borderRadius: '50%' }} />
              </motion.div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '32px 40px', background: 'rgba(249,115,22,0.04)', borderTop: '1px solid rgba(249,115,22,0.1)', borderBottom: '1px solid rgba(249,115,22,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24 }}>
          {[{ v: 12, s: '', l: 'Labels Per Sheet' }, { v: 105, s: 'x48mm', l: 'Label Dimensions' }, { v: 210, s: 'x297mm', l: 'A4 Page Size' }, { v: 100, s: '%', l: 'Print Accuracy' }].map((item, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05 }} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(28px,3vw,42px)', fontWeight: 900, color: '#f97316', lineHeight: 1 }}>
                <Counter target={item.v} suffix={item.s} />
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontWeight: 500, letterSpacing: 0.5 }}>{item.l}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '100px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="anim-on-scroll" style={{ opacity: 0, textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', padding: '4px 16px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 20, fontSize: 11, color: '#f97316', fontWeight: 700, letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' }}>
              Capabilities
            </div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, margin: 0, letterSpacing: -1 }}>
              Everything you need to print
            </h2>
            <p style={{ color: '#64748b', fontSize: 16, marginTop: 12, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
              Built for a single purpose — precise, fast, reliable label printing with cloud backup.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <TiltCard key={i}>
                <motion.div
                  className="anim-on-scroll"
                  onClick={() => setActiveFeature(i)}
                  whileHover={{ borderColor: f.accent, background: `rgba(${f.accent === '#f97316' ? '249,115,22' : f.accent === '#7c3aed' ? '124,58,237' : f.accent === '#2563eb' ? '37,99,235' : f.accent === '#22c55e' ? '34,197,94' : f.accent === '#f43f5e' ? '244,63,94' : '6,182,212'},0.06)` }}
                  style={{ opacity: 0, padding: 28, borderRadius: 16, border: `1px solid rgba(255,255,255,0.07)`, background: 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'border-color 0.3s, background 0.3s', height: '100%', transformStyle: 'preserve-3d' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: `${f.accent}18`, border: `1px solid ${f.accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: 'translateZ(10px)' }}>
                      <SVGIcon d={f.icon} size={22} stroke={f.accent} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#f1f5f9' }}>{f.title}</div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{f.body}</div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', background: `${f.accent}0d`, border: `1px solid ${f.accent}20`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: f.accent }}>{f.stat}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{f.sub}</span>
                  </div>
                </motion.div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 40px', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="anim-on-scroll" style={{ opacity: 0, textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', padding: '4px 16px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 20, fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' }}>
              Workflow
            </div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 900, margin: 0, letterSpacing: -1 }}>
              How it works
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0, position: 'relative' }}>
            {/* connector line */}
            <div style={{ position: 'absolute', top: 36, left: '8%', right: '8%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.3), transparent)', zIndex: 0 }} />
            {STEPS.map((step, i) => (
              <motion.div key={i} className="anim-on-scroll" whileHover={{ y: -4 }}
                style={{ opacity: 0, textAlign: 'center', padding: '0 24px 0', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))', border: '1px solid rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', position: 'relative' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#f97316', letterSpacing: 1 }}>{step.n}</span>
                  <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid rgba(249,115,22,0.1)' }} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: '#f1f5f9' }}>{step.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{step.body}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH SPECS ── */}
      <section id="specs" style={{ position: 'relative', zIndex: 1, padding: '100px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 80, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="anim-on-scroll" style={{ opacity: 0 }}>
              <div style={{ display: 'inline-block', padding: '4px 16px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 20, fontSize: 11, color: '#2563eb', fontWeight: 700, letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' }}>
                Print Specs
              </div>
              <h2 style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900, margin: '0 0 16px', letterSpacing: -1 }}>
                Engineered for<br />
                <span style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>exact alignment</span>
              </h2>
              <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, maxWidth: 380 }}>
                Every dimension is calculated to the millimeter. The CSS layout engine guarantees perfect physical alignment on any A4-capable printer.
              </p>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
              {SPECS.map((s, i) => (
                <motion.div key={i} className="anim-on-scroll" whileHover={{ background: 'rgba(249,115,22,0.04)' }}
                  style={{ opacity: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: i < SPECS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.2s' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace' }}>{s.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '60px 40px', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div className="anim-on-scroll" style={{ opacity: 0, fontSize: 11, color: '#475569', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 24 }}>
            Built with
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Supabase', 'PostgreSQL', 'JWT', 'jsPDF', 'Vercel'].map(t => (
              <motion.span key={t} className="anim-on-scroll" whileHover={{ scale: 1.06, borderColor: 'rgba(249,115,22,0.4)', color: '#f1f5f9' }}
                style={{ opacity: 0, padding: '8px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#64748b', fontWeight: 500, cursor: 'default', transition: 'all 0.2s' }}>
                {t}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '120px 40px' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <motion.div className="anim-on-scroll" style={{ opacity: 0 }}>
            <h2 style={{ fontSize: 'clamp(32px,5vw,60px)', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.1, letterSpacing: -2 }}>
              Ready to print<br />
              <span style={{ background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                with precision?
              </span>
            </h2>
            <p style={{ color: '#64748b', fontSize: 16, marginBottom: 40, lineHeight: 1.7 }}>
              Login to the admin dashboard and start printing professional labels for Shree Ganpati Agency today.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.04, boxShadow: '0 12px 40px rgba(249,115,22,0.45)' }}
                whileTap={{ scale: 0.97 }}
                style={{ padding: '16px 40px', background: 'linear-gradient(135deg,#f97316,#ea580c)', border: 'none', borderRadius: 12, color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 30px rgba(249,115,22,0.3)', letterSpacing: 0.3 }}>
                Open Dashboard
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ position: 'relative', zIndex: 1, padding: '28px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>Shree Ganpati Agency — Label Print System v2.0</div>
        <div style={{ fontSize: 12, color: '#1e293b' }}>Admin-only system. All rights reserved.</div>
      </footer>
    </div>
  );
}
