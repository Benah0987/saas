import React, { useContext } from "react";
import { AppBar, Toolbar, Typography, Button, IconButton, Avatar, Menu, MenuItem } from "@mui/material";
import { Home as HomeIcon, Person as PersonIcon, Logout as LogoutIcon } from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const navigate = useNavigate();

  // Open & Close User Menu
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <AppBar position="static" sx={{ backgroundColor: "#007bff" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* ✅ User Profile (Left Side) */}
        <IconButton onClick={handleMenuOpen} sx={{ color: "white" }}>
          <Avatar sx={{ bgcolor: "white", color: "#007bff" }}>{user?.username?.charAt(0).toUpperCase()}</Avatar>
        </IconButton>

        {/* ✅ User Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem disabled>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
              {user?.username || "User"}
            </Typography>
          </MenuItem>
          <MenuItem onClick={logout}>
            <LogoutIcon sx={{ marginRight: 1 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* ✅ Navigation Links (Right Side) */}
        <div>
          <Button color="inherit" startIcon={<HomeIcon />} onClick={() => navigate("/home")} sx={{ fontSize: "16px" }}>
            Home
          </Button>
          <Button color="inherit" startIcon={<PersonIcon />} onClick={() => navigate("/profile")} sx={{ fontSize: "16px" }}>
            Profile
          </Button>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
