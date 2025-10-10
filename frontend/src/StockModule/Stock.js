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
  const [error, setError] = useState("");

  const [show, setShow] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 🆕 Download modal states
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadDate, setDownloadDate] = useState(new Date());

  const role = localStorage.getItem("role");
  const storename = localStorage.getItem("storename");
  const username = localStorage.getItem("username");

  const navigate = useNavigate();

  // ✅ Load stock data
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
  const handleClose = () => setShow(false);

  const handleDownloadShow = () => {
    setDownloadDate(selectedDate || new Date());
    setShowDownloadModal(true);
  };

  const handleDownloadClose = () => setShowDownloadModal(false);

  // 🟢 Save Stock
  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !date ||
      !supplierName ||
      !stockDescription ||
      !stockQuantity ||
      !transportCost ||
      !buyingPrice ||
      !sellingPrice ||
      !receivedBy
    ) {
      setError("All fields are required");
      return;
    }

    const stringPattern = /^[A-Za-z\s.,!?]+$/;
    if (
      !stringPattern.test(supplierName) ||
      !stringPattern.test(stockDescription) ||
      !stringPattern.test(receivedBy)
    ) {
      setError(
        "Supplier Name, Description, and Received By should contain only letters and spaces."
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

    setError("");

    const stockInsert = {
      date: date.toISOString().split("T")[0],
      supplierName,
      stockDescription,
      stockQuantity,
      transportCost,
      buyingPrice,
      sellingPrice,
      receivedBy,
    };

    axios
      .post("https://accounting-system-1.onrender.com/stock/create-stock", stockInsert)
      .then(() => {
        setStockForm((prev) => [...prev, stockInsert]);
        setDate(new Date());
        setSupplierName("");
        setStockDescription("");
        setStockQuantity("");
        setTransportCost("");
        setBuyingPrice("");
        setSellingPrice("");
        setReceivedBy("");
        setShow(false);
      })
      .catch((error) => {
        console.error(error);
        setError("An error occurred while saving the batch.");
      });
  };

  // 🟡 Excel Download
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

      handleDownloadClose();
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading Excel. Check console for details.");
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

        <Button
          variant="success"
          onClick={handleDownloadShow}
          className="px-4"
        >
          DOWNLOAD EXCEL
        </Button>

        <Button
          variant="secondary"
          className="px-4"
          onClick={() => navigate(-1)}
        >
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

      {/* Stock Add Modal */}
      <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Add Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Date</label>
                <DatePicker
                  selected={date}
                  onChange={(d) => setDate(d)}
                  className="form-control"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Supplier Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Stock Description</label>
              <input
                type="text"
                className="form-control"
                value={stockDescription}
                onChange={(e) => setStockDescription(e.target.value)}
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label">Stock Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Transport Cost</label>
                <input
                  type="number"
                  className="form-control"
                  value={transportCost}
                  onChange={(e) => setTransportCost(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Buying Price</label>
                <input
                  type="number"
                  className="form-control"
                  value={buyingPrice}
                  onChange={(e) => setBuyingPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Selling Price</label>
                <input
                  type="number"
                  className="form-control"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Received By</label>
                <input
                  type="text"
                  className="form-control"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                />
              </div>
            </div>

            <Button variant="primary" type="submit" className="w-100 mt-4">
              FINALIZE STOCK
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      {/* 🆕 Download Date Modal */}
      <Modal show={showDownloadModal} onHide={handleDownloadClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select date to download</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DatePicker
            selected={downloadDate}
            onChange={(date) => setDownloadDate(date)}
            className="form-control"
            dateFormat="yyyy-MM-dd"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDownloadClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleExcelDownload}>
            Download Excel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Table */}
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
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center">
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
