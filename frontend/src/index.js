import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AuthProvider from "./context/AuthContext"; // ✅ Ensure correct path
import "./index.css";

const root = createRoot(document.getElementById("root")); // ✅ React 18 Best Practice

root.render(
  <React.StrictMode>
    <BrowserRouter> {/* ✅ Place BrowserRouter outside AuthProvider */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
