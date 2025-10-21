import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AccountingDashboard = () => {
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stock, setStock] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch sales
  useEffect(() => {
    axios.get("https://accounting-system-1.onrender.com/api/sales/get-sales")
      .then(res => setSales(res.data))
      .catch(err => console.error(err));

    axios.get("https://accounting-system-1.onrender.com/api/sales/get-expenses")
      .then(res => setExpenses(res.data))
      .catch(err => console.error(err));

    axios.get("https://accounting-system-1.onrender.com/api/sales/get-stock-items")
      .then(res => setStock(res.data))
      .catch(err => console.error(err));
  }, []);

  const filteredSales = sales.filter(sale => {
    const saleDate = sale.date ? new Date(sale.date).toISOString().split("T")[0] : "";
    const selected = selectedDate.toISOString().split("T")[0];
    return saleDate === selected;
  });

  const filteredExpenses = expenses.filter(exp => {
    const expDate = exp.date ? new Date(exp.date).toISOString().split("T")[0] : "";
    const selected = selectedDate.toISOString().split("T")[0];
    return expDate === selected;
  });

  const handleExport = () => {
    window.open("https://accounting-system-1.onrender.com/api/sales/export-report");
  };

  return (
    <div className="container mt-4">
      <h2>Accounting Dashboard</h2>
      <div className="mb-3">
        <label>Select Date:</label>
        <DatePicker
          selected={selectedDate}
          onChange={d => setSelectedDate(d)}
          className="form-control w-auto"
          dateFormat="yyyy-MM-dd"
        />
      </div>

      <button className="btn btn-success mb-4" onClick={handleExport}>
        Export Sales & Expenses Excel
      </button>

      <h4>Sales ({filteredSales.length})</h4>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.map((sale, i) => sale.items.map((item, idx) => (
            <tr key={`${i}-${idx}`}>
              <td>{sale.date?.split("T")[0]}</td>
              <td>{sale.customerName}</td>
              <td>{item.itemDescription}</td>
              <td>{item.quantity}</td>
              <td>{item.unitPrice}</td>
              <td>{item.totalPrice}</td>
            </tr>
          )))}
        </tbody>
      </table>

      <h4>Expenses ({filteredExpenses.length})</h4>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Date</th>
            <th>Issued To</th>
            <th>Description</th>
            <th>Payment Method</th>
            <th>Expense Type</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.map((exp, i) => (
            <tr key={i}>
              <td>{exp.date?.split("T")[0]}</td>
              <td>{exp.issuedTo}</td>
              <td>{exp.description}</td>
              <td>{exp.paymentMethod}</td>
              <td>{exp.expenseType}</td>
              <td>{exp.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Available Stock ({stock.length})</h4>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Unit Price</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((s, i) => (
            <tr key={i}>
              <td>{s.itemDescription}</td>
              <td>{s.unitPrice}</td>
              <td>{s.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccountingDashboard;
