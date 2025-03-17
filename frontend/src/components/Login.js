import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const { login, error, loading } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [localError, setLocalError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    
    const response = await login(formData);
    if (response.success) {
      navigate("/home");
    } else {
      setLocalError(response.message);
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      {localError && <p className="error-message">{localError}</p>}
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
      </form>
    </div>
  );
};

export default Login;
