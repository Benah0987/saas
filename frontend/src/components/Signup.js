import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { TextField, Button, Container, Typography, Paper, Box, CircularProgress, Grow } from "@mui/material";
import logo from "../assets/main-logo.svg"; // ✅ Updated path

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
    <Grow in timeout={700}>
      <Container maxWidth="xs">
        <Paper elevation={5} sx={{ padding: 4, textAlign: "center", marginTop: 5, borderRadius: 3 }}>
          {/* ✅ Logo Section */}
          <Box 
            component="img" 
            src={logo} 
            alt="Main Logo" 
            sx={{ width: "100%", maxWidth: "150px", margin: "0 auto 15px", display: "block" }} 
          />

          <Typography variant="h4" sx={{ marginBottom: 2, color: "primary.main" }}>
            Sign Up
          </Typography>

          {localError && <Typography color="error">{localError}</Typography>}
          {error && <Typography color="error">{error}</Typography>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Username" name="username" variant="outlined" fullWidth required value={formData.username} onChange={handleChange} />
            <TextField label="Email" name="email" type="email" variant="outlined" fullWidth required value={formData.email} onChange={handleChange} />
            <TextField label="Password" name="password" type="password" variant="outlined" fullWidth required value={formData.password} onChange={handleChange} />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{
                padding: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                transition: "all 0.3s ease-in-out",
                "&:hover": { backgroundColor: "secondary.main", transform: "scale(1.05)" },
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ marginTop: 2 }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "#0066ff", textDecoration: "none", fontWeight: "bold" }}>
              Log in
            </a>
          </Typography>
        </Paper>
      </Container>
    </Grow>
  );
};

export default Signup;
