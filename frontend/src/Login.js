import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RiLoginBoxFill } from 'react-icons/ri';
import image1 from './images/colcom.jpg';

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

      const { role, department, division, employeeNumber: returnedEmployeeNumber } = response.data.user;

      if (response.status === 200 && role) {
        // Clear previous session
        localStorage.clear();

        setLoggedIn(true);
        login(role);

        localStorage.setItem('role', role.toLowerCase());
        localStorage.setItem('storename', returnedStorename);
     

        toast.success('Login successful');
        navigate('/MainDashboard', { state: { role, dep: department, division } });
      } else {
        toast.error('Invalid credentials');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Login failed');
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
            <img
              src={image1}
              alt="Login Icon"
              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
            />
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
          <ToastContainer />
          <RiLoginBoxFill />
          <h2 className="text-center mb-4"><b>LOGIN</b></h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                placeholder="username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                placeholder="password"
                className="form-control"
                value={password}
                onChange={(e) => setNationalID(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-danger w-100" disabled={loading}>
              <b>{loading ? 'Logging in...' : 'LOGIN'}</b>
            </button>
            <div className="text-center mt-2">
              <Link to="/UserManagement"><i></i></Link>
            </div>
          </form>
        </div>

        <footer className="text-white bg-dark text-center p-2 position-fixed bottom-0 w-100">
          &copy; Colcom Foods Private Limited. All rights reserved.
        </footer>
      </div>
    </>
  );
}

export default Login;
