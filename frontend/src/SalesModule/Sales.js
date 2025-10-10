import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

// ✅ Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: type === "error" ? "#f8d7da" : "#d1e7dd",
        color: type === "error" ? "#842029" : "#0f5132",
        padding: "15px 25px",
        borderRadius: "8px",
        boxShadow: "0px 0px 10px rgba(0,0,0,0.3)",
        zIndex: 9999,
      }}
    >
      {message}
    </div>
  );
};

const Sales = () => {
  const { id } = useParams(); // Get sale ID from URL
  const [date, setDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [currency, setCurrency] = useState("");
  const [balance, setBalance] = useState("");
  const [quantity, setQuantity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [vat, setVat] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [salesList, setSalesList] = useState([]);

  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  // 🧮 Auto-calculate total price
  useEffect(() => {
    const q = parseFloat(quantity) || 0;
    const u = parseFloat(unitPrice) || 0;
    const v = parseFloat(vat) || 0;
    const base = q * u;
    const total = base + (v / 100) * base;
    setTotalPrice(total.toFixed(2));
  }, [quantity, unitPrice, vat]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
  };

  // 📥 Load existing sale data when editing
  useEffect(() => {
    if (id) {
      axios
        .get(`https://accounting-system-1.onrender.com/salesmodel/get-sale/${id}`)
        .then((res) => {
          const s = res.data;
          setDate(s.date);
          setCustomerName(s.customerName);
          setItemDescription(s.itemDescription);
          setCurrency(s.currency);
          setBalance(s.balance);
          setQuantity(s.quantity);
          setPaymentMethod(s.paymentMethod);
          setUnitPrice(s.unitPrice);
          setVat(s.vat);
          setTotalPrice(s.totalPrice);
        })
        .catch((err) => {
          console.error(err);
          showNotification("❌ Failed to load sale data.", "error");
        });
    }
  }, [id]);

  // 📜 Load all sales for duplicate check
  useEffect(() => {
    axios
      .get("https://accounting-system-1.onrender.com/salesmodel/get-sales")
      .then((res) => setSalesList(res.data))
      .catch((err) => console.error(err));
  }, []);

  // 💾 Submit updated sale
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!date || !customerName || !itemDescription || !currency || !paymentMethod) {
      showNotification("All required fields must be filled.", "error");
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      showNotification("Quantity must be a positive number.", "error");
      return;
    }

    if (isNaN(unitPrice) || unitPrice <= 0) {
      showNotification("Unit Price must be a positive number.", "error");
      return;
    }

    const isDuplicate = salesList.some(
      (sale) =>
        sale._id !== id &&
        sale.date === date &&
        sale.customerName.toLowerCase() === customerName.toLowerCase() &&
        sale.itemDescription.toLowerCase() === itemDescription.toLowerCase() &&
        Number(sale.totalPrice) === Number(totalPrice)
    );

    if (isDuplicate) {
      showNotification("Duplicate sale detected! Entry not saved.", "error");
      return;
    }

    const updatedSale = {
      date,
      cashierName: username,
      customerName,
      itemDescription,
      paymentMethod,
      currency,
      balance: parseFloat(balance) || 0,
      quantity: parseFloat(quantity),
      unitPrice: parseFloat(unitPrice),
      vat: parseFloat(vat) || 0,
      totalPrice: parseFloat(totalPrice),
    };

    axios
      .put(`https://accounting-system-1.onrender.com/salesmodel/update-sale/${id}`, updatedSale)
      .then(() => {
        showNotification("✅ Sale updated successfully!");
        setTimeout(() => navigate("/salesModuleDashboard"), 2000);
      })
      .catch((err) => {
        console.error(err);
        showNotification("❌ Failed to update sale. Try again.", "error");
      });
  };

  const handleCancel = () => navigate("/salesModuleDashboard");

  return (
    <div>
      {notification && (
        <Toast
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <nav className="navbar bg-dark border-bottom py-3 mb-3 shadow-sm rounded">
        <a className="navbar-brand text-white">
          <b>UPDATE SALE RECORD</b>
        </a>
      </nav>

      <div className="d-flex justify-content-end mb-3">
        <button onClick={handleCancel} className="btn btn-secondary">
          BACK
        </button>
      </div>

      <div className="card mx-auto shadow-lg" style={{ maxWidth: "90rem", marginTop: "1rem" }}>
        <div className="card-body">
          <p>UPDATE SALES FORM</p>
          <form onSubmit={handleSubmit}>
            <div className="d-flex gap-3 mb-3">
              <div className="form-group flex-1">
                <label>Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label>Cashier Name</label>
                <input type="text" className="form-control" value={username} disabled />
              </div>
            </div>

            <div className="form-group mb-3">
              <label>Customer Name</label>
              <input
                type="text"
                className="form-control"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="form-group mb-3">
              <label>Item Description</label>
              <textarea
                className="form-control"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
              />
            </div>

            <div className="d-flex gap-3 flex-wrap mb-3">
              <div className="form-group flex-1">
                <label>Payment Option</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option>Choose...</option>
                  <option>Cash</option>
                  <option>Ecocash USD</option>
                  <option>Ecocash ZIG</option>
                  <option>Zig Swipe</option>
                </select>
              </div>
              <div className="form-group flex-1">
                <label>Currency</label>
                <select
                  className="form-control"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option>Choose...</option>
                  <option>USD</option>
                  <option>ZWL</option>
                </select>
              </div>
            </div>

            <div className="d-flex gap-3 mb-3 justify-content-end flex-wrap">
              <div className="form-group" style={{ flexBasis: "200px" }}>
                <label>Balance</label>
                <input
                  type="number"
                  className="form-control"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flexBasis: "200px" }}>
                <label>Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flexBasis: "200px" }}>
                <label>Unit Price</label>
                <input
                  type="number"
                  className="form-control"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flexBasis: "200px" }}>
                <label>VAT (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={vat}
                  onChange={(e) => setVat(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flexBasis: "200px" }}>
                <label>Total Price</label>
                <input
                  type="number"
                  className="form-control"
                  value={totalPrice}
                  readOnly
                />
              </div>
            </div>

            <button type="submit" className="btn btn-success mt-3">
              UPDATE SALE
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-primary mt-3 ms-3"
            >
              CANCEL
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Sales;
