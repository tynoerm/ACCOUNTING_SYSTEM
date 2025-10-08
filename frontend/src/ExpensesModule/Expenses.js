import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";

const Expenses = () => {
  const [expensesForm, setExpensesForm] = useState([]);
  const [show, setShow] = useState(false);

  // NEW: download modal
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadDate, setDownloadDate] = useState("");

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const handleDownloadShow = () => {
    // default download date to currently selected date or today
    setDownloadDate(selectedDate || new Date().toISOString().split("T")[0]);
    setShowDownloadModal(true);
  };
  const handleDownloadClose = () => setShowDownloadModal(false);

  // Form state (kept exactly as you had it)
  const [date, setDate] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [amount, setAmount] = useState("");
  const [authorisedBy, setAuthorisedBy] = useState("");

  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const filteredExpenses = expensesForm.filter((q) => {
    const expenseDate = q.date ? new Date(q.date).toISOString().split("T")[0] : "";
    return expenseDate === selectedDate;
  });

  const navigate = useNavigate(); // ✅ For back navigation

  useEffect(() => {
    axios
      .get("https://accounting-system-1.onrender.com/expense/")
      .then((res) => {
        setExpensesForm(res.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!date || !issuedTo || !description || !paymentMethod || !expenseType || !authorisedBy) {
      setError("All fields are required.");
      return;
    }

    const stringPattern = /^[A-Za-z\s.,!?]+$/;
    if (!stringPattern.test(issuedTo) || !stringPattern.test(authorisedBy)) {
      setError("Issued To and Authorised By should only contain letters and spaces.");
      return;
    }

    if (description.length < 5) {
      setError("Description should be at least 5 characters long.");
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    setError("");

    const expensesInsert = {
      date,
      issuedTo,
      description,
      paymentMethod,
      expenseType,
      amount,
      authorisedBy,
    };

    axios
      .post("https://accounting-system-1.onrender.com/expense/create-expense", expensesInsert)
      .then((res) => {
        console.log({ status: res.status });
        setExpensesForm((prev) => [...prev, expensesInsert]);

        // Clear form fields after successful save
        setDate("");
        setIssuedTo("");
        setDescription("");
        setPaymentMethod("");
        setExpenseType("");
        setAmount("");
        setAuthorisedBy("");

        // Close modal after saving
        setShow(false);
      })
      .catch((error) => {
        console.error(error);
        setError("An error occurred while submitting the expense.");
      });
  };

  // NEW: downloads filtered Excel for provided date
  const handleExcelDownload = async () => {
    if (!downloadDate) {
      alert("Please select a date to download.");
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
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading Excel. Check console for details.");
    }
  };

  // Keep original handleDownload in case you want to call it elsewhere (unused for pdf button removal)
  const handleDownload = async (type) => {
    try {
      const response = await axios.get(
        `https://accounting-system-1.onrender.com/expense/download/${type}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `file.${type}`);
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
        <a className="navbar-brand text-white" href="#">
          <b>EXPENSES MANAGEMENT</b>
        </a>
      </nav>

      <div className="d-flex justify-content-between my-4">
        <Button variant="success" onClick={handleShow} className="px-4">
          CREATE AN EXPENSE
        </Button>

        <div className="d-flex justify-content-center">
          {/* PDF button removed from UI as requested; backend PDF route remains untouched */}
          <Button
            variant="success"
            onClick={handleDownloadShow}
            className="px-4"
          >
            DOWNLOAD EXCEL
          </Button>
        </div>

        {/* Back button unchanged */}
        <Button
          variant="secondary"
          className="px-4"
          onClick={() => navigate(-1)}
        >
          BACK
        </Button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-secondary">Expenses for {selectedDate}</h2>
        <input
          type="date"
          className="form-control w-auto"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        size="xl"
        aria-labelledby="expenses-form"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create an Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="date" className="form-label">
                  Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Issued To:</label>
                <input
                  type="text"
                  className="form-control"
                  id="issuedTo"
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label">Description</label>
              <textarea
                type="text"
                className="form-control"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
              <div className="form-group col-md-4" style={{ flex: "1" }}>
                <label htmlFor="paymentMethod">Payment Option</label>
                <select
                  id="paymentMethod"
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose...
                  </option>
                  <option>Cash</option>
                  <option>Ecocash</option>
                  <option>Ecocash Zig</option>
                  <option>Zig Swipe</option>
                </select>
              </div>

              <div className="form-group col-md-4" style={{ flex: "1" }}>
                <label>Type of Expense</label>
                <select
                  id="expenseType"
                  className="form-control"
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose...
                  </option>
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
                <label htmlFor="amount" className="form-label">
                  Amount
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="authorisedBy" className="form-label">
                  Authorised By
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="authorisedBy"
                  value={authorisedBy}
                  onChange={(e) => setAuthorisedBy(e.target.value)}
                />
              </div>
            </div>

            <Button variant="primary" type="submit" className="w-100 mt-4">
              FINALIZE EXPENSE
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      {/* NEW: Download date selection modal */}
      <Modal show={showDownloadModal} onHide={handleDownloadClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select date to download</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <input
            type="date"
            className="form-control"
            value={downloadDate}
            onChange={(e) => setDownloadDate(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDownloadClose}>Cancel</Button>
          <Button variant="success" onClick={handleExcelDownload}>Download Excel</Button>
        </Modal.Footer>
      </Modal>

      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Date:</th>
            <th>Issued To:</th>
            <th>Description:</th>
            <th>Payment Method:</th>
            <th>Expense Type:</th>
            <th>Amount:</th>
            <th>Authorised By:</th>
          </tr>
        </thead>

        <tbody>
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense, index) => (
              <tr key={index}>
                <td>{expense.date ? expense.date.split("T")[0] : "N/A"}</td>
                <td>{expense.issuedTo || "N/A"}</td>
                <td>{expense.description || "N/A"}</td>
                <td>{expense.paymentMethod || "N/A"}</td>
                <td>{expense.expenseType || "N/A"}</td>
                <td>{expense.amount !== undefined ? expense.amount : "N/A"}</td>
                <td>{expense.authorisedBy || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No expense is found per selected date</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Expenses;
