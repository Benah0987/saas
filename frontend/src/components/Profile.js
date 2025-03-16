import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout, token } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }

    const fetchFiles = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/files/user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok) {
          setFiles(data);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();
  }, [token, navigate]);

  return (
    <div>
      <h2>Profile</h2>
      {user ? <p>Welcome, {user.username}</p> : <p>Loading...</p>}
      <button onClick={logout}>Logout</button>

      <h3>Your Uploaded Files</h3>
      <ul>
        {files.map((file) => (
          <li key={file._id}>
            {file.filename} - <a href={file.url} download>Download</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Profile;
