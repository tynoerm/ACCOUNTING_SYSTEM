import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { RiLoginBoxFill } from 'react-icons/ri';

function Login({ setLoggedIn, login }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('https://accounting-system-1.onrender.com/users/login', {
        username,
        password,
      });

      console.log('Login response:', response.data);

      const { role, department, division, employeeNumber } = response.data.user;

      if (response.status === 200 && role) {
        // Clear previous session
        localStorage.clear();

        setLoggedIn(true);
        login(role);

        localStorage.setItem('role', role.toLowerCase());
        localStorage.setItem('employeeNumber', employeeNumber);

        alert('Login successful');
        navigate('/Dashboard', {
          state: { role, dep: department, division },
        });
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="navbar border-bottom shadow-lg p-1 mb-0 rounded bg-light">
        <div className="container-fluid">
          <span className="navbar-brand text-dark">
            &nbsp;
            <b>TIN PHIL INVESTMENTS</b>
          </span>
        </div>
      </nav>

      <div
        className="d-flex justify-content-center align-items-center bg-light"
        style={{ height: 'calc(100vh - 70px)' }}
      >
        <div className="card p-3 shadow" style={{ width: '400px' }}>
          <div className="text-center mb-2">
            <RiLoginBoxFill size={40} />
          </div>
          <h2 className="text-center mb-4">
            <b>LOGIN</b>
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                placeholder="Password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-danger w-100" disabled={loading}>
              <b>{loading ? 'Logging in...' : 'LOGIN'}</b>
            </button>
            <div className="text-center mt-2">
              <Link to="/UserManagement">Go to User Management</Link>
            </div>
          </form>
        </div>

        <footer className="text-white bg-dark text-center p-2 position-fixed bottom-0 w-100">
          &copy; TIN PHIL INVESTMENTS. All rights reserved.
        </footer>
      </div>
    </>
  );
}

export default Login;
