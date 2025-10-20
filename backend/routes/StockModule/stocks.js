import mongoose from "mongoose";
import express from "express";
import ExcelJS from "exceljs";
import stocksSchema from "../../models/StockModule/stocks.js";

let router = express.Router();

// Create stock
router.route("/create-stock").post(async (req, res, next) => {
  await stocksSchema
    .create(req.body)
    .then((result) => {
      res.json({
        data: result,
        message: "stocks created successfully",
        status: 200,
      });
    })
    .catch((err) => next(err));
});

// Get all stocks
router.route("/").get(async (req, res, next) => {
  await stocksSchema
    .find()
    .then((result) => {
      res.json({
        data: result,
        message: "stocks mapped successfully done",
        status: 200,
      });
    })
    .catch((err) => next(err));
});

router.get("/download/excel", async (req, res) => {
  try {
    const { date } = req.query;

    let query = {};
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const files = await stocksSchema.find(query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Stock Report");

    worksheet.columns = [
      { header: "No.", key: "no", width: 5 },
      { header: "Date", key: "date", width: 15 },
      { header: "Supplier Name", key: "supplierName", width: 20 },
      { header: "Stock Description", key: "stockDescription", width: 25 },
      { header: "Stock Quantity", key: "stockQuantity", width: 15 },
      { header: "Transport Cost", key: "transportCost", width: 15 },
      { header: "Buying Price", key: "buyingPrice", width: 15 },
      { header: "Selling Price", key: "sellingPrice", width: 15 },
      { header: "Received By", key: "receivedBy", width: 20 },
    ];

    files.forEach((file, index) => {
      worksheet.addRow({
        no: index + 1,
        date: file.date ? file.date.toISOString().split("T")[0] : "N/A",
        supplierName: file.supplierName || "N/A",
        stockDescription: file.stockDescription || "N/A",
        stockQuantity: file.stockQuantity || 0,
        transportCost: file.transportCost || 0,
        buyingPrice: file.buyingPrice || 0,
        sellingPrice: file.sellingPrice || 0,
        receivedBy: file.receivedBy || "N/A",
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="stock_report_${date || "all"}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating Excel file");
  }
});


export { router as stocksRoutes };
