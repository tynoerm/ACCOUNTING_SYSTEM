import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Stock = () => {
  const [stockForm, setStockForm] = useState([]);

  // Add / Edit form states
  const [date, setDate] = useState(new Date());
  const [supplierName, setSupplierName] = useState("");
  const [stockDescription, setStockDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [error, setError] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadDate, setDownloadDate] = useState(new Date());

  const [selectedStock, setSelectedStock] = useState(null);

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

  // 📥 Excel download
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

  // 🟢 Add Stock
  const handleAddStock = (e) => {
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
      .then((res) => {
        setStockForm((prev) => [...prev, res.data]);
        clearForm();
        setShowAddModal(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Error adding stock.");
      });
  };

  // ✏️ Update Stock
  const handleUpdateStock = (e) => {
    e.preventDefault();
    if (!selectedStock) return;

    const updatedData = {
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
      .put(
        `https://accounting-system-1.onrender.com/stock/update/${selectedStock._id}`,
        updatedData
      )
      .then(() => {
        setStockForm((prev) =>
          prev.map((item) =>
            item._id === selectedStock._id ? { ...item, ...updatedData } : item
          )
        );
        clearForm();
        setShowUpdateModal(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Error updating stock.");
      });
  };

  const handleEdit = (stock) => {
    setSelectedStock(stock);
    setDate(new Date(stock.date));
    setSupplierName(stock.supplierName);
    setStockDescription(stock.stockDescription);
    setStockQuantity(stock.stockQuantity);
    setTransportCost(stock.transportCost);
    setBuyingPrice(stock.buyingPrice);
    setSellingPrice(stock.sellingPrice);
    setReceivedBy(stock.receivedBy);
    setShowUpdateModal(true);
  };

  const clearForm = () => {
    setDate(new Date());
    setSupplierName("");
    setStockDescription("");
    setStockQuantity("");
    setTransportCost("");
    setBuyingPrice("");
    setSellingPrice("");
    setReceivedBy("");
    setError("");
  };

  return (
    <div>
      <nav className="navbar navbar-dark bg-dark border-bottom border-light py-3">
        <a className="navbar-brand text-white" href="#">
          <b>STOCK MANAGEMENT</b>
        </a>
      </nav>

      <div className="d-flex justify-content-between my-4">
        <Button variant="success" onClick={() => setShowAddModal(true)}>
          ADD STOCK
        </Button>
        <Button variant="success" onClick={() => setShowDownloadModal(true)}>
          DOWNLOAD EXCEL
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>
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
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredStock.length > 0 ? (
            filteredStock.map((stock, index) => (
              <tr key={index}>
                <td>{stock.date?.split("T")[0]}</td>
                <td>{stock.supplierName}</td>
                <td>{stock.stockDescription}</td>
                <td>{stock.stockQuantity}</td>
                <td>{stock.transportCost}</td>
                <td>{stock.buyingPrice}</td>
                <td>{stock.sellingPrice}</td>
                <td>{stock.receivedBy}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleEdit(stock)}
                  >
                    Edit
                  </Button>
                </td>
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

      {/* 🟢 Add Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleAddStock}>
            <StockFormFields
              date={date}
              setDate={setDate}
              supplierName={supplierName}
              setSupplierName={setSupplierName}
              stockDescription={stockDescription}
              setStockDescription={setStockDescription}
              stockQuantity={stockQuantity}
              setStockQuantity={setStockQuantity}
              transportCost={transportCost}
              setTransportCost={setTransportCost}
              buyingPrice={buyingPrice}
              setBuyingPrice={setBuyingPrice}
              sellingPrice={sellingPrice}
              setSellingPrice={setSellingPrice}
              receivedBy={receivedBy}
              setReceivedBy={setReceivedBy}
            />
            <Button type="submit" variant="primary" className="w-100 mt-4">
              FINALIZE STOCK
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      {/* ✏️ Update Modal */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Update Stock</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleUpdateStock}>
            <StockFormFields
              date={date}
              setDate={setDate}
              supplierName={supplierName}
              setSupplierName={setSupplierName}
              stockDescription={stockDescription}
              setStockDescription={setStockDescription}
              stockQuantity={stockQuantity}
              setStockQuantity={setStockQuantity}
              transportCost={transportCost}
              setTransportCost={setTransportCost}
              buyingPrice={buyingPrice}
              setBuyingPrice={setBuyingPrice}
              sellingPrice={sellingPrice}
              setSellingPrice={setSellingPrice}
              receivedBy={receivedBy}
              setReceivedBy={setReceivedBy}
            />
            <Button type="submit" variant="success" className="w-100 mt-4">
              UPDATE STOCK
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      {/* 📥 Download Modal */}
      <Modal show={showDownloadModal} onHide={() => setShowDownloadModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Date to Download</Modal.Title>
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
          <Button variant="secondary" onClick={() => setShowDownloadModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleExcelDownload}>
            Download Excel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Reusable form fields component
const StockFormFields = ({
  date,
  setDate,
  supplierName,
  setSupplierName,
  stockDescription,
  setStockDescription,
  stockQuantity,
  setStockQuantity,
  transportCost,
  setTransportCost,
  buyingPrice,
  setBuyingPrice,
  sellingPrice,
  setSellingPrice,
  receivedBy,
  setReceivedBy,
}) => (
  <>
    <div className="row mb-3">
      <div className="col-md-6">
        <label>Date</label>
        <DatePicker
          selected={date}
          onChange={setDate}
          className="form-control"
          dateFormat="yyyy-MM-dd"
        />
      </div>
      <div className="col-md-6">
        <label>Supplier Name</label>
        <input
          type="text"
          className="form-control"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
        />
      </div>
    </div>

    <div className="mb-3">
      <label>Stock Description</label>
      <input
        type="text"
        className="form-control"
        value={stockDescription}
        onChange={(e) => setStockDescription(e.target.value)}
      />
    </div>

    <div className="row mb-3">
      <div className="col-md-4">
        <label>Quantity</label>
        <input
          type="number"
          className="form-control"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(e.target.value)}
        />
      </div>
      <div className="col-md-4">
        <label>Transport Cost</label>
        <input
          type="number"
          className="form-control"
          value={transportCost}
          onChange={(e) => setTransportCost(e.target.value)}
        />
      </div>
      <div className="col-md-4">
        <label>Buying Price</label>
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
        <label>Selling Price</label>
        <input
          type="number"
          className="form-control"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
        />
      </div>
      <div className="col-md-6">
        <label>Received By</label>
        <input
          type="text"
          className="form-control"
          value={receivedBy}
          onChange={(e) => setReceivedBy(e.target.value)}
        />
      </div>
    </div>
  </>
);

export default Stock;
