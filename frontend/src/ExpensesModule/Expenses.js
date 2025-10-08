import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";

// Notification component
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: type === "error" ? "#f8d7da" : "#d1e7dd",
        color: type === "error" ? "#842029" : "#0f5132",
        padding: "20px 30px",
        borderRadius: "10px",
        boxShadow: "0px 0px 10px rgba(0,0,0,0.3)",
        zIndex: 9999,
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
};

const Expenses = () => {
  const [expensesForm, setExpensesForm] = useState([]);
  const [show, setShow] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadDate, setDownloadDate] = useState("");
  const [date, setDate] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [amount, setAmount] = useState("");
  const [authorisedBy, setAuthorisedBy] = useState("");
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const navigate = useNavigate();

  const userRole = localStorage.getItem("role"); // "admin" or "user"

  // Fetch expenses
  useEffect(() => {
    axios
      .get("https://accounting-system-1.onrender.com/expense/")
      .then((res) => setExpensesForm(res.data.data))
      .catch((err) => console.log(err));
  }, []);

  const filteredExpenses = expensesForm.filter((q) => {
    const expenseDate = q.date ? new Date(q.date).toISOString().split("T")[0] : "";
    return expenseDate === selectedDate;
  });

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);
  const handleDownloadShow = () => {
    setDownloadDate(selectedDate || new Date().toISOString().split("T")[0]);
    setShowDownloadModal(true);
  };
  const handleDownloadClose = () => setShowDownloadModal(false);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!date || !issuedTo || !description || !paymentMethod || !expenseType || !authorisedBy) {
      showNotification("All fields are required.", "error");
      return;
    }

    const stringPattern = /^[A-Za-z\s.,!?]+$/;
    if (!stringPattern.test(issuedTo) || !stringPattern.test(authorisedBy)) {
      showNotification("Issued To and Authorised By should only contain letters and spaces.", "error");
      return;
    }

    if (description.length < 5) {
      showNotification("Description should be at least 5 characters long.", "error");
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      showNotification("Amount must be a positive number.", "error");
      return;
    }

    const isDuplicate = expensesForm.some(
      (exp) =>
        exp.date === date &&
        exp.issuedTo.toLowerCase() === issuedTo.toLowerCase() &&
        exp.description.toLowerCase() === description.toLowerCase() &&
        Number(exp.amount) === Number(amount)
    );

    if (isDuplicate) {
      showNotification("Duplicate expense detected! Entry not saved.", "error");
      return;
    }

    const expensesInsert = { date, issuedTo, description, paymentMethod, expenseType, amount, authorisedBy };

    axios
      .post("https://accounting-system-1.onrender.com/expense/create-expense", expensesInsert)
      .then((res) => {
        setExpensesForm((prev) => [...prev, { ...expensesInsert, _id: res.data.data._id }]);
        setDate(""); setIssuedTo(""); setDescription(""); setPaymentMethod(""); setExpenseType(""); setAmount(""); setAuthorisedBy("");
        setShow(false);
        showNotification("Expense saved successfully!");
      })
      .catch((err) => {
        console.error(err);
        showNotification("An error occurred while submitting the expense.", "error");
      });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      await axios.delete(`https://accounting-system-1.onrender.com/expense/${id}`);
      setExpensesForm((prev) => prev.filter((expense) => expense._id !== id));
      showNotification("Expense deleted successfully!");
    } catch (err) {
      console.error(err);
      showNotification("Failed to delete expense.", "error");
    }
  };

  const handleExcelDownload = async () => {
    if (!downloadDate) {
      showNotification("Please select a date to download.", "error");
      return;
    }
    try {
      const response = await axios.get(
        `https://accounting-system-1.onrender.com/expense/download/excel?date=${downloadDate}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `expenses_${downloadDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      handleDownloadClose();
      showNotification("Excel downloaded successfully!");
    } catch (err) {
      console.error(err);
      showNotification("Error downloading Excel.", "error");
    }
  };

  return (
    <div>
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
      )}

      <nav className="navbar navbar-dark bg-dark border-bottom border-light py-3">
        <a className="navbar-brand text-white" href="#"><b>EXPENSES MANAGEMENT</b></a>
      </nav>

      <div className="d-flex justify-content-between my-4">
        <Button variant="success" onClick={handleShow} className="px-4">CREATE AN EXPENSE</Button>
        <Button variant="success" onClick={handleDownloadShow} className="px-4">DOWNLOAD EXCEL</Button>
        <Button variant="secondary" className="px-4" onClick={() => navigate(-1)}>BACK</Button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-secondary">Expenses for {selectedDate}</h2>
        <input type="date" className="form-control w-auto" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      </div>

      {/* Create Expense Modal */}
      <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Create an Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Issued To:</label>
                <input type="text" className="form-control" value={issuedTo} onChange={(e) => setIssuedTo(e.target.value)} />
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <div className="form-group col-md-4" style={{ flex: "1" }}>
                <label>Payment Option</label>
                <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="" disabled>Choose...</option>
                  <option>Cash</option>
                  <option>Ecocash</option>
                  <option>Ecocash Zig</option>
                  <option>Zig Swipe</option>
                </select>
              </div>
              <div className="form-group col-md-4" style={{ flex: "1" }}>
                <label>Type of Expense</label>
                <select className="form-control" value={expenseType} onChange={(e) => setExpenseType(e.target.value)}>
                  <option value="" disabled>Choose...</option>
                  <option>food</option>
                  <option>transport fee</option>
                  <option>fuel</option>
                  <option>rent</option>
                  <option>liscence</option>
                  <option>salary and wages</option>
                  <option>collection</option>
                  <option>personal expenses</option>
                  <option>electricity</option>
                  <option>water</option>
                  <option>bike charges</option>
                  <option>city parking</option>
                  <option>airtime</option>
                  <option>shop expenses</option>
                </select>
              </div>
            </div>

            <div className="row mb-3 mt-3">
              <div className="col-md-6">
                <label className="form-label">Amount</label>
                <input type="number" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Authorised By</label>
                <input type="text" className="form-control" value={authorisedBy} onChange={(e) => setAuthorisedBy(e.target.value)} />
              </div>
            </div>

            <Button variant="primary" type="submit" className="w-100 mt-4">FINALIZE EXPENSE</Button>
          </form>
        </Modal.Body>
      </Modal>

      {/* Download Modal */}
      <Modal show={showDownloadModal} onHide={handleDownloadClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select date to download</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input type="date" className="form-control" value={downloadDate} onChange={(e) => setDownloadDate(e.target.value)} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDownloadClose}>Cancel</Button>
          <Button variant="success" onClick={handleExcelDownload}>Download Excel</Button>
        </Modal.Footer>
      </Modal>

      {/* Expenses Table */}
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Issued To</th>
            <th>Description</th>
            <th>Payment Method</th>
            <th>Expense Type</th>
            <th>Amount</th>
            <th>Authorised By</th>
            {userRole === "admin" && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense) => (
              <tr key={expense._id}>
                <td>{expense.date ? expense.date.split("T")[0] : "N/A"}</td>
                <td>{expense.issuedTo || "N/A"}</td>
                <td>{expense.description || "N/A"}</td>
                <td>{expense.paymentMethod || "N/A"}</td>
                <td>{expense.expenseType || "N/A"}</td>
                <td>{expense.amount !== undefined ? expense.amount : "N/A"}</td>
                <td>{expense.authorisedBy || "N/A"}</td>
                {userRole === "admin" && (
                  <td>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(expense._id)}>Delete</Button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={userRole === "admin" ? 8 : 7}>No expense is found per selected date</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Expenses;
