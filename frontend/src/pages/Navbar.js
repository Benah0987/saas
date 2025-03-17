import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // ✅ Get authentication state
import { FaUserCircle } from "react-icons/fa"; // ✅ Default user icon


const Navbar = () => {
  const { user } = useContext(AuthContext); // ✅ Get user data from context

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2>KEMRI</h2>
      </div>
      
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/profile">Profile</Link></li>
      </ul>

      <div className="navbar-user">
        {user ? (
          <Link to="/profile" className="user-info">
            {user.profilePic ? (
              <img src={user.profilePic} alt="User" className="user-avatar" />
            ) : (
              <span className="user-name">{user.name}</span>
            )}
          </Link>
        ) : (
          <FaUserCircle className="user-icon" />
        )}
      </div>
    </nav>
  );
};

export default Navbar;
