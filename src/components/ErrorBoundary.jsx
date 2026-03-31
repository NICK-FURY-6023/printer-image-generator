import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Sentry integration point
    if (window.__SENTRY_LOADED__ && window.Sentry) {
      window.Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } });
    }
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0f172a', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{ textAlign: 'center', maxWidth: 480, padding: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#f87171' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
              The application encountered an unexpected error.
              Your data has been auto-saved. Try reloading the page.
            </p>
            {this.state.error && (
              <details style={{
                textAlign: 'left', marginBottom: 20, background: '#1e293b', borderRadius: 8,
                padding: 12, border: '1px solid #334155', fontSize: 12, color: '#94a3b8',
              }}>
                <summary style={{ cursor: 'pointer', color: '#f97316', fontWeight: 600, marginBottom: 8 }}>
                  Error Details
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'monospace', fontSize: 11 }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white',
                  border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Reload Page
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null, errorInfo: null }); }}
                style={{
                  background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
                  border: '1px solid #334155', borderRadius: 8, padding: '10px 24px',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
