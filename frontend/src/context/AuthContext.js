import React, { createContext, useState, useEffect } from 'react';

// Create authentication context
export const AuthContext = createContext();

// Provider component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  // Fetch user profile using JWT token
  const fetchUserProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      logout();
    }
  };

  // Login function
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
