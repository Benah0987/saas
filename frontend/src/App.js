import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import Profile from "./components/Profile";
import Home from "./pages/Home";
import Navbar from "./pages/Navbar"; // ✅ Ensure correct import

function App() {
  const location = useLocation();

  // ✅ Show Navbar on both "Home" & "Profile" pages
  const showNavbar = location.pathname === "/home" || location.pathname === "/profile";

  return (
    <>
      {showNavbar && <Navbar />} {/* ✅ Navbar now shows on both pages */}

      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
}

export default App;
