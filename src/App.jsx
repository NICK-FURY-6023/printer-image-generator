import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl animate-bounce">🪔</div>
          <div className="text-sm font-medium" style={{ color: '#f97316' }}>
            Shree Ganpati Agency
          </div>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin-slow"
               style={{ borderColor: '#f97316', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', fontSize: '13px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <AppContent />
    </AuthProvider>
  );
}

