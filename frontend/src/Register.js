import React, { useState } from 'react';
import axios from 'axios';
import { RiLoginBoxFill } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import { IoLogOutSharp } from "react-icons/io5";
import { IoMdArrowRoundBack } from "react-icons/io";

function Register() {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [storename, setStorename] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('https://accounting-system-1.onrender.com/users/create-user', {
                fullName, // ✅ Correct key
                username,
                password,
                role,
                storename,
            });

            if (response.status === 201 || response.status === 200) {
                alert('User registered successfully');

                const userData = {
                    fullName,
                    username,
                    storename,
                    password,
                    role,
                };

                // Reset form
                setFullName('');
                setUsername('');
                setStorename('');
                setPassword('');
                setRole('');

                navigate('/users', { state: { newUser: userData } });
            } else {
                alert('Registration failed');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Something went wrong');
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
                                <label>Username:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label>Password:</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-12 mb-3">
                                <label>Role:</label>
                                <select
                                    className="form-control"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Role --</option>
                                    <option value="clerk">clerk</option>
                                    <option value="admin">admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-12 mb-3">
                                <label>Storename:</label>
                                <select
                                    className="form-control"
                                    value={storename}
                                    onChange={(e) => setStorename(e.target.value)}
                                    required
                                >
                                    <option value="">-- Select Store --</option>
                                    <option value="gweru">gweru</option>
                                    <option value="kaguvi">kaguvi</option>
                                    <option value="admin">admin</option>    
                                        <option value="bishopgaul">bishopgaul</option>  
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


