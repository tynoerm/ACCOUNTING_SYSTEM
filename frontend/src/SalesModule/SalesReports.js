import { Button } from 'react-bootstrap';
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';

const SalesReports = () => {
  const [salesReportsForm, setSalesReportsForm] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedUser, setSelectedUser] = useState(""); // cashier filter

  // ✅ Get Sales and Expenses
  useEffect(() => {
    axios.get("https://accounting-system-1.onrender.com/salesmodel")
      .then((res) => setSalesReportsForm(res.data.data))
      .catch((error) => console.log(error));

    axios.get("https://accounting-system-1.onrender.com/expenses")
      .then((res) => setExpenses(res.data.data))
      .catch((error) => console.log(error));
  }, []);

  // ✅ Filter sales by selected date and user
  const filteredSales = salesReportsForm.filter(q => {
    const dateMatch = q.date ? new Date(q.date).toISOString().split("T")[0] === selectedDate : false;
    const userMatch = selectedUser ? q.cashierName === selectedUser : true;
    return dateMatch && userMatch;
  });

  // ✅ Filter expenses by selected date
  const filteredExpenses = expenses.filter(e => {
    return e.date ? new Date(e.date).toISOString().split("T")[0] === selectedDate : false;
  });

  // ✅ Unique list of users for dropdown
  const uniqueUsers = [...new Set(salesReportsForm.map(s => s.cashierName).filter(Boolean))];

  // ✅ Totals
  const totalSales = filteredSales.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
  const totalExpenses = filteredExpenses.reduce((acc, item) => acc + (item.amount || 0), 0);

  const handleDownload = async (type) => {
    try {
      const response = await axios.get(
        `https://accounting-system-1.onrender.com/salesmodel/download/${type}?date=${selectedDate}&user=${selectedUser}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `sales_report.${type}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  return (
    <div>
      <nav className="navbar navbar-dark bg-dark border-bottom border-light py-3">
        <a className="navbar-brand text-white"><b>SALES & EXPENSES REPORTS</b></a>
      </nav>

      <div className="d-flex justify-content-between align-items-center my-3">
        <Link to="/" className="btn btn-success">BACK</Link>

        <div className="d-flex gap-2">
          <Button variant="primary" onClick={() => handleDownload("pdf")}>DOWNLOAD PDF</Button>
          <Button variant="success" onClick={() => handleDownload("excel")}>DOWNLOAD EXCEL</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="d-flex gap-3 mb-3">
        <input
          type="date"
          className="form-control w-auto"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />

        <select
          className="form-control w-auto"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">All Users</option>
          {uniqueUsers.map((user, i) => (
            <option key={i} value={user}>{user}</option>
          ))}
        </select>
      </div>

      {/* Totals */}
      <div className="alert alert-info d-flex justify-content-between">
        <span><b>Total Sales ({selectedDate})</b>: ${totalSales.toFixed(2)}</span>
        <span><b>Total Expenses ({selectedDate})</b>: ${totalExpenses.toFixed(2)}</span>
      </div>

      {/* Sales Table */}
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Cashier</th>
            <th>Customer</th>
            <th>Item</th>
            <th>Currency</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>VAT</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.length > 0 ? (
            filteredSales.map((sale, index) => (
              <tr key={index}>
                <td>{sale.date?.split("T")[0] || "N/A"}</td>
                <td>{sale.cashierName || "N/A"}</td>
                <td>{sale.customerName || "N/A"}</td>
                <td>{sale.itemDescription || "N/A"}</td>
                <td>{sale.currency || "N/A"}</td>
                <td>{sale.quantity || "0"}</td>
                <td>{sale.unitPrice || "0.00"}</td>
                <td>{sale.vat || "0.00"}</td>
                <td>{sale.totalPrice || "0.00"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center">No sales found for selected filters</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SalesReports;
