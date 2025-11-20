import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => {
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
        zIndex: 9999,
        fontWeight: "500",
      }}
    >
      {message}
    </div>
  );
};

const Sales = () => {
  const [items, setItems] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("");

  const [itemDescription, setItemDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [vat, setVat] = useState("");

  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Cashier";

  const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
  const vatAmount = items.reduce(
    (acc, item) => acc + ((item.vat || 0) / 100) * item.totalPrice,
    0
  );
  const grandTotal = subtotal + vatAmount;

  const showNotification = (message, type = "success") =>
    setNotification({ message, type });

  const clearItemFields = () => {
    setItemDescription("");
    setQuantity("");
    setUnitPrice("");
    setVat("");
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!itemDescription || !quantity || !unitPrice) {
      showNotification("Fill in all item fields before adding.", "error");
      return;
    }

    const q = parseFloat(quantity);
    const u = parseFloat(unitPrice);
    const v = parseFloat(vat) || 0;
    const totalPrice = q * u;

    const newItem = {
      itemDescription,
      quantity: q,
      unitPrice: u,
      vat: v,
      totalPrice,
    };
    setItems((prev) => [...prev, newItem]);
    clearItemFields();
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!paymentMethod) {
      showNotification("Choose a payment method.", "error");
      return;
    }

    if (items.length === 0) {
      showNotification("Add at least one item.", "error");
      return;
    }

    try {
      const saleData = {
        date,
        cashierName: username,
        paymentMethod,
        items,
        subtotal,
        vatAmount,
        grandTotal,
      };

      await axios.post(
        "https://accounting-system-1.onrender.com/salesmodel/create-sale",
        saleData
      );

      showNotification("Sale Saved Successfully!");

      setItems([]);
      setPaymentMethod("");
      setDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      console.error(err);
      showNotification("Failed to save sale.", "error");
    }
  };

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
        <a className="navbar-brand text-white ms-3">
          <b>POINT OF SALE SYSTEM</b>
        </a>
      </nav>

      <div className="d-flex justify-content-end mb-3 mx-3">
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          ⬅ BACK
        </button>
      </div>

      <div className="card mx-auto shadow-lg mb-4" style={{ maxWidth: "90rem" }}>
        <div className="card-body">
          <p className="h5 mb-4 text-primary fw-bold">🧾 Sale Information</p>

          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-3">
                <label>Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label>Cashier</label>
                <input type="text" className="form-control" value={username} disabled />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-3">
                <label>Payment Method</label>
                <select
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="">Choose...</option>
                  <option>Cash</option>
                  <option>Ecocash USD</option>
                </select>
              </div>
            </div>

            <hr />
            <p className="fw-bold text-secondary">Add Items</p>

            <div className="row mb-3">
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Item Description"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="Unit Price"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
              </div>

              <div className="col-md-2">
                <input
                  type="number"
                  className="form-control"
                  placeholder="VAT (%)"
                  value={vat}
                  onChange={(e) => setVat(e.target.value)}
                />
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <button className="btn btn-success w-100" onClick={handleAddItem}>
                  ➕ Add Item
                </button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="table-responsive mb-4">
                <table className="table table-striped table-bordered">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>VAT (%)</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{item.itemDescription}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unitPrice.toFixed(2)}</td>
                        <td>{item.vat || 0}</td>
                        <td>
                          {(
                            item.totalPrice + ((item.vat || 0) / 100) * item.totalPrice
                          ).toFixed(2)}
                        </td>

                        <td>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveItem(i)}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="d-flex justify-content-end gap-4 mb-4">
              <div>
                <p className="mb-1 fw-bold">Subtotal:</p>
                <p className="mb-1 fw-bold">VAT:</p>
                <p className="mb-1 fw-bold text-primary">Grand Total:</p>
              </div>

              <div className="text-end">
                <p className="mb-1">{subtotal.toFixed(2)}</p>
                <p className="mb-1">{vatAmount.toFixed(2)}</p>
                <p className="mb-1 text-primary fw-bold fs-5">
                  {grandTotal.toFixed(2)}
                </p>
              </div>
            </div>

            <button type="submit" className="btn btn-primary ms-3">
              ✅ SAVE
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Sales;
