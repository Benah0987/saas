import React, { createContext, useState, useEffect } from "react";

// Create authentication context
export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Ensure token and user data are stored persistently
  const setAuthToken = (newToken, userData) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    }
  };

  // ✅ Fetch user profile on mount if token exists
  useEffect(() => {
    if (token && !user) {
      fetchUserProfile(token);
    }
  }, [token]);

  // ✅ Fetch user profile function
  const fetchUserProfile = async (authToken) => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.status === 404) {
        console.warn("⚠️ Profile not found. Logging out.");
        logout();
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data)); // ✅ Store user persistently
    } catch (err) {
      console.error("❌ Error fetching user profile:", err);
      logout();
    }
  };

  // ✅ Login function
  const login = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("📤 Sending login request:", formData);
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("📨 Login Response:", data);

      if (!res.ok) throw new Error(data.message || "Login failed");

      console.log("🔑 Token received on login:", data.token);
      setAuthToken(data.token, data.user);
      return { success: true };
    } catch (err) {
      console.error("❌ Login Error:", err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };


  // ✅ Signup function (Redirects using window.location)

const signup = async (formData) => {
  setLoading(true);
  setError(null);

  try {
    console.log("📤 Sending signup request:", formData);
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    console.log("📨 Signup Response:", data);

    if (!res.ok) throw new Error(data.message || "Signup failed");

    console.log("✅ Signup successful, redirecting to login...");
    window.location.href = "/login"; // Redirect after signup

    return { success: true };
  } catch (err) {
    console.error("❌ Signup Error:", err);
    setError(err.message);
    return { success: false, message: err.message };
  } finally {
    setLoading(false);
  }
};

  // ✅ Logout function (Redirects using window.location)
  const logout = () => {
    console.warn("🚪 Logging out...");
    setAuthToken(null);
    setUser(null);
    window.location.href = "/login"; // 👈 Redirect after logout
  };

  // ✅ File Upload with Token Authentication
  const uploadFiles = async (files) => {
    const authToken = localStorage.getItem("token"); // Always retrieve latest token

    console.log("📂 Token used for upload:", authToken);

    if (!authToken) {
      console.error("❌ Upload Error: No token found in localStorage");
      return { success: false, message: "No token found" };
    }

    setLoading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("file", file));

    try {
      const response = await fetch("http://localhost:5000/api/files/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }, // Ensure token is set
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");

      return { success: true, message: "Files uploaded successfully!" };
    } catch (err) {
      console.error("❌ Upload error:", err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, signup, logout, uploadFiles, loading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
