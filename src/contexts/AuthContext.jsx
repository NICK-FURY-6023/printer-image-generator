import { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    // Check token expiry client-side before network call
    try {
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        sessionStorage.removeItem('token');
        setToken(null);
        setLoading(false);
        return;
      }
    } catch { /* let server verify */ }
    api.default
      .get('/api/auth/verify')
      .then((res) => {
        setUser(res.data.user);
        setToken(storedToken);
      })
      .catch(() => {
        sessionStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    sessionStorage.setItem('token', data.token);
    setToken(data.token);
    setUser({ role: 'admin', email }); // server returns only token, set user explicitly
    return data;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
