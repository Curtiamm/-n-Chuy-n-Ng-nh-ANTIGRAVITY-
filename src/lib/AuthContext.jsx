import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('heulwen_token');
    const savedUser = localStorage.getItem('heulwen_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoadingAuth(false);
  }, []);

  const login = async (idToken) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken }),
    });
    if (!res.ok) throw new Error('Đăng nhập thất bại');
    const data = await res.json();
    localStorage.setItem('heulwen_token', data.access_token);
    localStorage.setItem('heulwen_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('heulwen_token');
    localStorage.removeItem('heulwen_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      isAuthenticated: !!user,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      login,
      logout,
      navigateToLogin: () => window.location.href = '/login',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
