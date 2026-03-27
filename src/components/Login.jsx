import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(234,88,12,0.25) 0%, transparent 70%), #0f172a',
      }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: '-10%', right: '-5%', width: 320, height: 320,
        background: 'radial-gradient(circle, rgba(234,88,12,0.15), transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', left: '-5%', width: 280, height: 280,
        background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div
        className="animate-fade-in w-full max-w-sm relative"
        style={{
          background: 'rgba(30,41,59,0.8)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(249,115,22,0.25)',
          borderRadius: 20,
          padding: '40px 36px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(249,115,22,0.08)',
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
            boxShadow: '0 0 30px rgba(249,115,22,0.4)',
          }}>
            🪔
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            Shree Ganpati Agency
          </h1>
          <p style={{ fontSize: 12, color: '#f97316', marginTop: 4, fontWeight: 500, letterSpacing: '0.05em' }}>
            LABEL PRINT SYSTEM
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-fade-in" style={{
            marginBottom: 20, padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, color: '#fca5a5', fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.05em' }}>
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ganpati.com"
              className="input-dark"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.05em' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="input-dark"
                style={{ paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#475569',
                  fontSize: 14, padding: 0, lineHeight: 1,
                }}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-saffron"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14 }}
          >
            {loading ? (
              <>
                <span className="animate-spin-slow" style={{ display: 'inline-block' }}>⏳</span>
                Signing in…
              </>
            ) : (
              <>🔐 Sign In</>
            )}
          </button>
        </form>

        <div style={{
          marginTop: 28, paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 11, color: '#334155' }}>
            © {new Date().getFullYear()} Shree Ganpati Agency · Admin Access Only
          </p>
        </div>
      </div>
    </div>
  );
}
