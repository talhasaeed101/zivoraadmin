import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adminAuthApi, getStoredToken, setStoredToken } from '../services/api.js';

const ADMIN_KEY = 'zivora_admin_data';

const AuthContext = createContext(null);

const getStoredAdmin = () => {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setStoredAdmin = (admin) => {
  if (admin) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  } else {
    localStorage.removeItem(ADMIN_KEY);
  }
};

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(getStoredAdmin);
  const [token, setToken] = useState(getStoredToken);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setStoredToken(null);
    setStoredAdmin(null);
    setToken(null);
    setAdmin(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await adminAuthApi.login(email, password);
    const { admin: adminData, token: authToken } = response.data;

    setStoredToken(authToken);
    setStoredAdmin(adminData);
    setToken(authToken);
    setAdmin(adminData);
    console.log("dsssss")
    return adminData;
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      const storedAdmin = getStoredAdmin();

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);
      setAdmin(storedAdmin);

      try {
        const response = await adminAuthApi.getProfile();
        setAdmin(response.data);
        setStoredAdmin(response.data);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [logout]);

  const value = useMemo(
    () => ({
      admin,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [admin, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
