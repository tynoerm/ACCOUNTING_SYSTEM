import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RiLoginBoxFill } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import image1 from './images/colcom.jpg';

import { IoLogOutSharp } from "react-icons/io5";
import { IoMdArrowRoundBack } from "react-icons/io";

function Register() {
    const [fullname, setFullname] = useState('');
    const [username, setUsername] = useState('');
    const [storename, setStorename] = useState('');
    const [password, setPassword] = useState('');  // will mirror nationalId
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Sync password with nationalId whenever nationalId changes
    const handleNationalIdChange = (e) => {
        setNationalId(e.target.value);
        setPassword(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('https://accounting-system-1.onrender.com/users/create-user', {
                fullname,
                username,
                password,  
                role,
                storename,
            });

            if (response.status === 201 || response.status === 200) {
                toast.success('User registered successfully');

                const userData = {
                    fullName,
                    employerNumber,
                    password,
                    nationalId,
                    role,
                    department,
                };

                // Reset form fields
                setFullName('');
                setEmployerNumber('');
                setNationalId('');
                setPassword('');
                setRole('');
                setDepartment('');

                // Navigate to users page with new user data
                navigate('/users', { state: { newUser: userData } });
            } else {
                toast.error('Registration failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => navigate(-1);

    return (
        <>
            <nav className="navbar border-bottom shadow-lg p-1 mb-0 rounded" style={{ backgroundColor: 'white' }}>
                <div className="container-fluid d-flex justify-content-between align-items-center">
                    <span className="navbar-brand text-black d-flex align-items-center">
                        <img src={image1} alt="Login Icon" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                        &nbsp;<b>REGISTER NEW USER</b>
                    </span>

                    <div className="d-flex gap-2">
                        <button onClick={handleBack} className="btn btn-primary">
                            <b><IoMdArrowRoundBack /> Back</b>
                        </button>
                        <button className="btn btn-danger" onClick={() => {
                            localStorage.clear();
                            navigate('/');
                        }}>
                            <b><IoLogOutSharp /> Logout</b>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="d-flex justify-content-center align-items-center bg-light" style={{ height: 'calc(100vh - 70px)' }}>
                <div className="card p-4 shadow" style={{ width: '80%', maxWidth: '700px' }}>
                    <ToastContainer />
                    <h5 className="text-center mb-3">
                        <b><RiLoginBoxFill /> ADD A NEW USER</b>
                    </h5>

                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Full Name:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label>Employer Number:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={employerNumber}
                                    onChange={(e) => setEmployerNumber(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            {/* Password input removed, password is set automatically */}
                            
                            <div className="col-md-6 mb-3">
                                <label>National ID:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={nationalId}
                                    onChange={handleNationalIdChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Role:</label>
                                <select
                                    className="form-control"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Role --</option>
                                    <option value="client">Client</option>
                                    <option value="deptmanager">Department Manager</option>
                                    <option value="hr">Human Resources</option>
                                    <option value="itmanagement">IT Management</option>
                                </select>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label>Department:</label>
                                <select
                                    className="form-control"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Department --</option>
                                    <option value="finance">Finance</option>
                                    <option value="operations">Operations</option>
                                    <option value="sales">Sales</option>
                                    <option value="itdepartment">IT Department</option>
                                    <option value="retailshops">Retail Shops</option>
                                    <option value="nec">NEC</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-dark w-100" disabled={loading}>
                            {loading ? 'Creating...' : 'CREATE'}
                        </button>
                    </form>
                </div>

                <footer className="text-white bg-dark text-center p-2 fixed-bottom">
                    &copy; TIN PHIL INVESTMENTS. All rights reserved.
                </footer>
            </div>
        </>
    );
}

export default Register;
