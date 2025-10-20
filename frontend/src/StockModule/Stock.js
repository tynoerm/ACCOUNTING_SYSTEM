import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  const [tempStockItems, setTempStockItems] = useState([]);

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadDate, setDownloadDate] = useState(new Date());

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [selectedStockItem, setSelectedStockItem] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("https://accounting-system-1.onrender.com/stock/")
      .then((res) => setStockForm(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  const filteredStock = stockForm.filter((q) => {
    const stockDate = q.date ? new Date(q.date).toISOString().split("T")[0] : "";
    return stockDate === selectedDate.toISOString().split("T")[0];
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
        "Supplier Name, Description, Received By, and Location must contain valid characters."
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
        "Quantity, Buying Price, and Selling Price must be positive. Transport Cost cannot be negative."
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

  const handleExcelDownload = async () => {
    if (!downloadDate) return alert("Please select a date first.");

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
    } catch (err) {
      console.error("Error downloading Excel:", err);
      alert("Error downloading Excel file.");
    }
  };

  const handleTransferStock = async (e) => {
    e.preventDefault();
    if (!selectedStockItem || !fromLocation || !toLocation || !transferQuantity) {
      return alert("All fields are required for transfer.");
    }

    try {
      await axios.post("https://accounting-system-1.onrender.com/stock/transfer", {
        stockId: selectedStockItem,
        fromLocation,
        toLocation,
        quantity: transferQuantity,
      });
      alert("Stock transferred successfully");
      setShowTransferModal(false);
      setFromLocation("");
      setToLocation("");
      setTransferQuantity("");
      setSelectedStockItem("");
    } catch (err) {
      console.error(err);
      alert("Error transferring stock");
    }
  };

  return (
    <div className="container my-4">
      <nav className="navbar navbar-dark bg-dark border-bottom border-light py-3 mb-4">
        <span className="navbar-brand mb-0 h1 text-white"><b>STOCK MANAGEMENT</b></span>
      </nav>

      <div className="d-flex flex-wrap justify-content-between mb-4 gap-2">
        <Button variant="success" onClick={handleShow}>ADD STOCK</Button>
        <Button variant="primary" onClick={() => setShowTransferModal(true)}>TRANSFER STOCK</Button>
        <Button variant="success" onClick={() => setShowDownloadModal(true)}>DOWNLOAD EXCEL</Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>BACK</Button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="text-secondary">Stock for {selectedDate.toISOString().split("T")[0]}</h4>
        <DatePicker
          selected={selectedDate}
          onChange={setSelectedDate}
          className="form-control w-auto"
          dateFormat="yyyy-MM-dd"
        />
      </div>

      {/* Add Stock Modal */}
      <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Add Stock (Multiple Items)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmitAll}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Date</label>
                <DatePicker selected={date} onChange={setDate} className="form-control" dateFormat="yyyy-MM-dd" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Supplier Name</label>
                <input type="text" className="form-control" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Enter supplier name" />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Stock Description</label>
              <input type="text" className="form-control" value={stockDescription} onChange={(e) => setStockDescription(e.target.value)} placeholder="Enter stock description" />
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Stock Quantity</label>
                <input type="number" className="form-control" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Transport Cost</label>
                <input type="number" className="form-control" value={transportCost} onChange={(e) => setTransportCost(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Buying Price</label>
                <input type="number" className="form-control" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Selling Price</label>
                <input type="number" className="form-control" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Received By</label>
                <input type="text" className="form-control" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Stock Location</label>
                <input type="text" className="form-control" value={stockLocation} onChange={(e) => setStockLocation(e.target.value)} />
              </div>
            </div>

            <Button type="button" variant="secondary" className="w-100 mb-3" onClick={handleAddItem}>
              ADD ITEM TO LIST
            </Button>

            {tempStockItems.length > 0 && (
              <div className="mb-3">
                <h5 className="mb-2">Items to be submitted:</h5>
                <table className="table table-bordered">
                  <thead className="table-light">
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

            <Button type="submit" variant="primary" className="w-100 mt-2">FINALIZE ALL STOCK ITEMS</Button>
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
              <select className="form-control" value={selectedStockItem} onChange={(e) => setSelectedStockItem(e.target.value)}>
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
              <input type="text" className="form-control" value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} />
            </div>

            <div className="mb-3">
              <label>To Location</label>
              <input type="text" className="form-control" value={toLocation} onChange={(e) => setToLocation(e.target.value)} />
            </div>

            <div className="mb-3">
              <label>Transfer Quantity</label>
              <input type="number" className="form-control" value={transferQuantity} onChange={(e) => setTransferQuantity(e.target.value)} />
            </div>

            <Button type="submit" variant="primary" className="w-100">TRANSFER</Button>
          </form>
        </Modal.Body>
      </Modal>

      {/* Stock Table */}
      <table className="table table-striped table-bordered mt-4">
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
          {filteredStock.length ? (
            filteredStock.map((stock, idx) => (
              <tr key={idx}>
                <td>{stock.date?.split("T")[0] || "N/A"}</td>
                <td>{stock.supplierName || "N/A"}</td>
                <td>{stock.stockDescription || "N/A"}</td>
                <td>{stock.stockQuantity || "0"}</td>
                <td>{stock.transportCost || "0.00"}</td>
                <td>{stock.buyingPrice || "0.00"}</td>
                <td>{stock.sellingPrice || "0.00"}</td>
                <td>{stock.receivedBy || "N/A"}</td>
                <td>{stock.stockLocation || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center">No stock records found for this date.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Stock;
