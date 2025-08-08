import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";

import SalesModuleDashboard from './SalesModule/Dashboard';
import Sales from './SalesModule/Sales';
import Quotation from './SalesModule/Quotation';
import SalesReports from './SalesModule/SalesReports';

import Expenses from './ExpensesModule/Expenses';
import Stock from './StockModule/Stock';

import Footer from './Components/Footer'; // Optional

function App() {
  // Global state for login and user role
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState(null);

  // Function to handle login and set role
  const login = (userRole) => {
    setRole(userRole);
    setLoggedIn(true);
  };

  return (
    <Router>
      <Routes>
        {/* Pass setLoggedIn and login handler to Login component */}
        <Route path="/" element={<Login setLoggedIn={setLoggedIn} login={login} />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Sales" element={<Sales />} />
        <Route path="/SalesModuleDashboard" element={<SalesModuleDashboard />} />
        <Route path="/Quotation" element={<Quotation />} />
        <Route path="/Expenses" element={<Expenses />} />
        <Route path="/Stock" element={<Stock />} />
        <Route path="/SalesReports" element={<SalesReports />} />
      </Routes>

      {/* Optional footer */}
      {/* <Footer /> */}
    </Router>
  );
}

export default App;
