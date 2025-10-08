import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";

const Stock = () => {
  const [stockForm, setStockForm] = useState([]);
  const [date, setDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [stockDescription, setStockDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const role = localStorage.getItem("role");
  const storename = localStorage.getItem("storename");
  const username = localStorage.getItem("username");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const filteredStock = stockForm.filter((q) => {
    const stockDate = q.date ? new Date(q.date).toISOString().split("T")[0] : "";
    return stockDate === selectedDate;
  });

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("https://accounting-system-1.onrender.com/stock/")
      .then((res) => {
        setStockForm(res.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

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
      date,
      supplierName,
      stockDescription,
      stockQuantity,
      transportCost,
      buyingPrice,
      sellingPrice,
      receivedBy,
    };

    axios
      .post(
        "https://accounting-system-1.onrender.com/stock/create-stock",
        stockInsert
      )
      .then((res) => {
        setStockForm((prev) => [...prev, stockInsert]);
        setDate("");
        setSupplierName("");
        setStockDescription("");
        setStockQuantity("");
        setTransportCost("");
        setBuyingPrice("");
        setSellingPrice("");
        setReceivedBy("");
      })
      .catch((error) => {
        console.error(error);
        setError("An error occurred while saving the batch.");
      });
  };

  // 📥 Download Excel by Date
  const handleExcelDownload = async () => {
    if (!selectedDate) {
      alert("Please select a date first.");
      return;
    }

    try {
      const response = await axios.get(
        `https://accounting-system-1.onrender.com/stock/download/excel?date=${selectedDate}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stock_${selectedDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading Excel file:", error);
    }
  };

  return (
    <div>
      <nav className="navbar navbar-dark bg-dark border-bottom border-light py-3">
        <a className="navbar-brand text-white" href="#">
          <b>STOCK MODULE</b>
        </a>
      </nav>

      <div className="d-flex justify-content-between my-4">
        <Button variant="success" onClick={handleShow} className="px-4">
          CREATE STOCK BATCH
        </Button>

        <div className="d-flex justify-content-end">
          {/* 🟢 Only Excel download remains */}
          <Button
            variant="success"
            onClick={handleExcelDownload}
            className="px-4"
          >
            DOWNLOAD EXCEL BY DATE
          </Button>
        </div>

        <Button
          variant="secondary"
          className="px-4"
          onClick={() => navigate(-1)}
        >
          BACK
        </Button>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-secondary">Stocks for {selectedDate}</h2>
        <input
          type="date"
          className="form-control w-auto"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Create Stock Modal */}
      <Modal
        show={show}
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create a Batch</Modal.Title>
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
                <label className="form-label">Supplier Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="supplierName"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Received By</label>
                <input
                  type="text"
                  className="form-control"
                  id="receivedBy"
                  value={receivedBy}
                  placeholder={username || "Enter name"}
                  onChange={(e) => setReceivedBy(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="stockDescription" className="form-label">
                  Stock Description
                </label>
                <textarea
                  type="text"
                  className="form-control"
                  id="stockDescription"
                  value={stockDescription}
                  onChange={(e) => setStockDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Stock Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  id="stockQuantity"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Transport Cost</label>
                <input
                  type="number"
                  className="form-control"
                  id="transportCost"
                  value={transportCost}
                  onChange={(e) => setTransportCost(e.target.value)}
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Buying Price</label>
                <input
                  type="number"
                  className="form-control"
                  id="buyingPrice"
                  value={buyingPrice}
                  onChange={(e) => setBuyingPrice(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="sellingPrice" className="form-label">
                  Selling Price
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="sellingPrice"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                />
              </div>
            </div>

            <Button variant="primary" type="submit" className="w-100 mt-4">
              SAVE & ADD NEXT
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      <table className="table table-striped table-bordered">
        <thead className="table-dark">
          <tr>
            <th>Date:</th>
            <th>Supplier Name:</th>
            <th>Description:</th>
            <th>Quantity:</th>
            <th>Buying Price:</th>
            <th>Selling Price:</th>
            <th>Received By:</th>
          </tr>
        </thead>

        <tbody>
          {Array.isArray(filteredStock) && filteredStock.length > 0 ? (
            filteredStock.map((stock, index) => (
              <tr key={index}>
                <td>{stock.date ? stock.date.split("T")[0] : "N/A"}</td>
                <td>{stock.supplierName || "N/A"}</td>
                <td>{stock.stockDescription || "N/A"}</td>
                <td>{stock.stockQuantity || "N/A"}</td>
                <td>{stock.buyingPrice || "N/A"}</td>
                <td>{stock.sellingPrice || "N/A"}</td>
                <td>{stock.receivedBy || "N/A"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No stock found for the selected date</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Stock;
