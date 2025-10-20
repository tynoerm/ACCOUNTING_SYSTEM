import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "bootstrap-icons/font/bootstrap-icons.css"; // for icons

const Stock = () => {
  const [stockForm, setStockForm] = useState([]);

  const [date, setDate] = useState(new Date());
  const [supplierName, setSupplierName] = useState("");
  const [stockDescription, setStockDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [stockLocation, setStockLocation] = useState("");
  const [error, setError] = useState("");

  const [show, setShow] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [tempStockItems, setTempStockItems] = useState([]); // Temporary items

  // Download modal states
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadDate, setDownloadDate] = useState(new Date());

  // Transfer modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [selectedStockItem, setSelectedStockItem] = useState("");

  const navigate = useNavigate();

  // Load stock data
  useEffect(() => {
    axios
      .get("https://accounting-system-1.onrender.com/stock/")
      .then((res) => setStockForm(res.data.data))
      .catch((error) => console.log(error));
  }, []);

  // Filter by selected date
  const filteredStock = stockForm.filter((q) => {
    const stockDate = q.date ? new Date(q.date).toISOString().split("T")[0] : "";
    const selectedString = selectedDate.toISOString().split("T")[0];
    return stockDate === selectedString;
  });

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setTempStockItems([]);
    clearFormFields();
    setError("");
  };

  const clearFormFields = () => {
    setStockDescription("");
    setStockQuantity("");
    setTransportCost("");
    setBuyingPrice("");
    setSellingPrice("");
    setReceivedBy("");
    setStockLocation("");
  };

  // Add single item to temporary list
  const handleAddItem = () => {
    if (
      !date ||
      !supplierName ||
      !stockDescription ||
      !stockQuantity ||
      !transportCost ||
      !buyingPrice ||
      !sellingPrice ||
      !receivedBy ||
      !stockLocation
    ) {
      setError("All fields are required");
      return;
    }

    const stringPattern = /^[A-Za-z0-9\s.,!?-]+$/;
    if (
      !stringPattern.test(supplierName) ||
      !stringPattern.test(stockDescription) ||
      !stringPattern.test(receivedBy) ||
      !stringPattern.test(stockLocation)
    ) {
      setError(
        "Supplier Name, Description, Received By and Location should contain valid characters."
      );
      return;
    }

    if (
      isNaN(stockQuantity) ||
      stockQuantity <= 0 ||
      isNaN(transportCost) ||
      transportCost < 0 ||
      isNaN(buyingPrice) ||
      buyingPrice <= 0 ||
      isNaN(sellingPrice) ||
      sellingPrice <= 0
    ) {
      setError(
        "Stock Quantity, Buying Price, and Selling Price should be positive. Transport Cost cannot be negative."
      );
      return;
    }

    const newItem = {
      date: date.toISOString().split("T")[0],
      supplierName,
      stockDescription,
      stockQuantity,
      transportCost,
      buyingPrice,
      sellingPrice,
      receivedBy,
      stockLocation,
    };

    setTempStockItems([...tempStockItems, newItem]);
    clearFormFields();
    setError("");
  };

  // Submit all temporary items to backend
  const handleSubmitAll = async (e) => {
    e.preventDefault();
    if (tempStockItems.length === 0) {
      setError("Add at least one stock item before submitting");
      return;
    }

    try {
      await axios.post(
        "https://accounting-system-1.onrender.com/stock/create-stock",
        tempStockItems
      );
      setStockForm([...stockForm, ...tempStockItems]);
      setTempStockItems([]);
      handleClose();
    } catch (err) {
      console.error(err);
      setError("Error submitting stock items");
    }
  };

  // Excel download
  const handleExcelDownload = async () => {
    if (!downloadDate) {
      alert("Please select a date first.");
      return;
    }

    try {
      const dateString = downloadDate.toISOString().split("T")[0];
      const response = await axios.get(
        `https://accounting-system-1.onrender.com/stock/download/excel?date=${dateString}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stocks_${dateString}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowDownloadModal(false);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading Excel. Check console for details.");
    }
  };

  // Transfer stock
  const handleTransferStock = async (e) => {
    e.preventDefault();

    if (!selectedStockItem || !fromLocation || !toLocation || !transferQuantity) {
      alert("Please fill in all fields.");
      return;
    }

    const payload = {
      stockId: selectedStockItem,
      fromLocation,
      toLocation,
      quantity: transferQuantity,
    };

    try {
      await axios.post("https://accounting-system-1.onrender.com/stock/transfer", payload);
      alert("Stock transferred successfully");
      setShowTransferModal(false);
      setFromLocation("");
      setToLocation("");
      setTransferQuantity("");
      setSelectedStockItem("");
    } catch (error) {
      console.error(error);
      alert("Error transferring stock.");
    }
  };

  return (
    <div>
      <nav className="navbar navbar-dark bg-dark border-bottom border-light py-3">
        <a className="navbar-brand text-white" href="#">
          <b>STOCK MANAGEMENT</b>
        </a>
      </nav>

      <div className="d-flex justify-content-between my-4">
        <Button variant="success" onClick={handleShow} className="px-4">
          ADD STOCK
        </Button>

        <Button variant="primary" onClick={() => setShowTransferModal(true)} className="px-4">
          TRANSFER STOCK
        </Button>

        <Button variant="success" onClick={() => setShowDownloadModal(true)} className="px-4">
          DOWNLOAD EXCEL
        </Button>

        <Button variant="secondary" className="px-4" onClick={() => navigate(-1)}>
          BACK
        </Button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-secondary">
          Stock for {selectedDate.toISOString().split("T")[0]}
        </h2>
        <DatePicker
          selected={selectedDate}
          onChange={(date) => setSelectedDate(date)}
          className="form-control w-auto"
          dateFormat="yyyy-MM-dd"
        />
      </div>

      {/* Add Stock Modal */}
      <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} size="xl">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-primary">Add Stock (Multiple Items)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmitAll}>
            {error && (
              <div className="alert alert-danger text-center">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </div>
            )}

            {/* Supplier & Date */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="form-floating">
                  <DatePicker
                    selected={date}
                    onChange={(d) => setDate(d)}
                    className="form-control"
                    dateFormat="yyyy-MM-dd"
                  />
                  <label>Date</label>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                  />
                  <label>Supplier Name</label>
                </div>
              </div>
            </div>

            {/* Stock Description */}
            <div className="mb-3">
              <div className="form-floating">
                <input
                  type="text"
                  className="form-control"
                  value={stockDescription}
                  onChange={(e) => setStockDescription(e.target.value)}
                />
                <label>Stock Description</label>
              </div>
            </div>

            {/* Quantity, Transport, Buying Price */}
            <div className="row mb-3">
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="number"
                    className="form-control"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                  />
                  <label>Stock Quantity</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="number"
                    className="form-control"
                    value={transportCost}
                    onChange={(e) => setTransportCost(e.target.value)}
                  />
                  <label>Transport Cost</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="number"
                    className="form-control"
                    value={buyingPrice}
                    onChange={(e) => setBuyingPrice(e.target.value)}
                  />
                  <label>Buying Price</label>
                </div>
              </div>
            </div>

            {/* Selling Price, Received By, Location */}
            <div className="row mb-3">
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="number"
                    className="form-control"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                  />
                  <label>Selling Price</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                  />
                  <label>Received By</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    value={stockLocation}
                    onChange={(e) => setStockLocation(e.target.value)}
                  />
                  <label>Stock Location</label>
                </div>
              </div>
            </div>

            {/* Add to temporary list */}
            <Button
              type="button"
              variant="outline-secondary"
              className="w-100 mb-3 fw-bold"
              onClick={handleAddItem}
            >
              <i className="bi bi-plus-circle me-2"></i> Add Item to List
            </Button>

            {/* Temporary Items Table */}
            {tempStockItems.length > 0 && (
              <div className="mb-3 p-3 border rounded bg-light">
                <h5 className="text-primary fw-bold">Items to be Submitted</h5>
                <table className="table table-hover table-bordered mt-2">
                  <thead className="table-secondary">
                    <tr>
                      <th>Description</th>
                      <th>Quantity</th>
                      <th>Location</th>
                      <th>Received By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tempStockItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.stockDescription}</td>
                        <td>{item.stockQuantity}</td>
                        <td>{item.stockLocation}</td>
                        <td>{item.receivedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Button variant="primary" type="submit" className="w-100 fw-bold">
              <i className="bi bi-check2-circle me-2"></i> Finalize All Stock Items
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      {/* Transfer Stock Modal */}
      <Modal show={showTransferModal} onHide={() => setShowTransferModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Transfer Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleTransferStock}>
            <div className="mb-3">
              <label>Select Stock Item</label>
              <select
                className="form-control"
                value={selectedStockItem}
                onChange={(e) => setSelectedStockItem(e.target.value)}
              >
                <option value="">--Select--</option>
                {stockForm.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.stockDescription} ({item.stockLocation}) - Qty: {item.stockQuantity}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label>From Location</label>
              <input
                type="text"
                className="form-control"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label>To Location</label>
              <input
                type="text"
                className="form-control"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label>Transfer Quantity</label>
              <input
                type="number"
                className="form-control"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
              />
            </div>

            <Button type="submit" variant="primary" className="w-100">
              TRANSFER
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      {/* Stock Table */}
      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Supplier Name</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Transport Cost</th>
            <th>Buying Price</th>
            <th>Selling Price</th>
            <th>Received By</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {filteredStock.length > 0 ? (
            filteredStock.map((stock, index) => (
              <tr key={index}>
                <td>{stock.date ? stock.date.split("T")[0] : "N/A"}</td>
                <td>{stock.supplierName || "N/A"}</td>
                <td>{stock.stockDescription || "N/A"}</td>
                <td>{stock.stockQuantity || "N/A"}</td>
                <td>{stock.transportCost || "0.00"}</td>
                <td>{stock.buyingPrice || "0.00"}</td>
                <td>{stock.sellingPrice || "0.00"}</td>
                <td>{stock.receivedBy || "N/A"}</td>
                <td>{stock.stockLocation || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center">
                No stock records found for this date.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Stock;
