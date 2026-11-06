import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const save = ({ data }) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };
  const login = async (email, password) => save(await api.post('/auth/login', { email, password }));
  const register = async (form) => save(await api.post('/auth/register', form));
  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* token may already be invalid */ }
    localStorage.removeItem('token');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
