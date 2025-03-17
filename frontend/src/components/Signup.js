import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Signup = () => {
  const { signup, error, loading } = useContext(AuthContext);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [localError, setLocalError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    
    const response = await signup(formData);
    if (response.success) {
      navigate("/home");
    } else {
      setLocalError(response.message);
    }
  };

  return (
    <div className="container">
      <h2>Signup</h2>
      {localError && <p className="error-message">{localError}</p>}
      {error && <p className="error-message">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="username" 
          placeholder="Username" 
          value={formData.username} 
          onChange={handleChange} 
          required 
        />
        
        <input 
          type="email" 
          name="email" 
          placeholder="Email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
        />
        
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          value={formData.password} 
          onChange={handleChange} 
          required 
        />
        
        <button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Signup"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
