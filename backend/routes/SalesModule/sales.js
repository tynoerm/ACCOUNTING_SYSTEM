import express from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import fs from "fs";
import salesModel from "../../models/SalesModule/sales.js";
import stockModel from "../../models/StockModule/stocks.js";
import expensesModel from "../../models/ExpensesModule/expenses.js";

const router = express.Router();

/* ================= CREATE SALE ================= */
router.post("/create-sale", async (req, res) => {
  try {
    const { items } = req.body;

    // Deduct stock
    for (const soldItem of items) {
      const stockItem = await stockModel.findOne({
        itemDescription: soldItem.itemDescription,
      });

      if (stockItem) {
        stockItem.quantity -= soldItem.quantity;
        if (stockItem.quantity < 0) stockItem.quantity = 0;
        await stockItem.save();
      }
    }

    const result = await salesModel.create(req.body);
    res.json({ data: result, message: "Sale created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create sale" });
  }
});

/* ================= GET STOCK ITEMS ================= */
router.get("/get-stock-items", async (req, res) => {
  try {
    const stocks = await stockModel.find(
      { quantity: { $gt: 0 } },
      "itemDescription unitPrice quantity"
    );
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch stock items" });
  }
});

/* ================= GET SALES ================= */
router.get("/get-sales", async (req, res) => {
  try {
    const sales = await salesModel.find().sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

/* ================= DELETE SALE ================= */
router.delete("/delete-sale/:id", async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // Restore stock
    for (const soldItem of sale.items) {
      const stockItem = await stockModel.findOne({
        itemDescription: soldItem.itemDescription,
      });

      if (stockItem) {
        stockItem.quantity += soldItem.quantity;
        await stockItem.save();
      }
    }

    await salesModel.findByIdAndDelete(req.params.id);

    res.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete sale" });
  }
});

/* ================= EXPORT BEAUTIFUL PDF INVOICE ================= */
router.get("/export-sale-invoice/:id", async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const doc = new PDFDocument({ margin: 40 });
    const filePath = `invoice-${sale._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${sale._id}.pdf`
    );

    doc.pipe(res);

    /* ---------- BEAUTIFUL HEADER ---------- */
    doc
      .fillColor("#003366")
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("SALES INVOICE", { align: "center" });

    doc.moveDown(1);

    doc
      .fontSize(12)
      .fillColor("#000")
      .font("Helvetica")
      .text("🏢 Company Name: XYZ Traders", { align: "center" })
      .text("📍 Address: 123 Main Street, Harare, Zimbabwe", { align: "center" })
      .text("☎ Phone: +263 77 000 0000", { align: "center" })
      .text("📧 Email: info@xyztraders.co.zw", { align: "center" });

    doc.moveDown(2);
    doc.strokeColor("#003366").lineWidth(2).moveTo(40, doc.y).lineTo(560, doc.y).stroke();

    /* ---------- SALE DETAILS ---------- */
    doc.moveDown(2);
    doc.fontSize(14).font("Helvetica-Bold").text("Invoice Details");
    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica");
    doc.text(`Invoice ID: ${sale._id}`);
    doc.text(`Customer: ${sale.customerName || "N/A"}`);
    doc.text(`Date: ${new Date(sale.date).toLocaleString()}`);
    doc.moveDown(1);

    /* ---------- TABLE HEADER ---------- */
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Item", 40, doc.y);
    doc.text("Qty", 250, doc.y);
    doc.text("Price", 330, doc.y);
    doc.text("Total", 450, doc.y);

    doc.moveDown(0.5);
    doc.strokeColor("#666").lineWidth(1).moveTo(40, doc.y).lineTo(560, doc.y).stroke();

    /* ---------- TABLE ROWS ---------- */
    doc.font("Helvetica").fontSize(12);
    let totalAmount = 0;

    sale.items.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;

      doc.moveDown(0.5);
      doc.text(item.itemDescription, 40);
      doc.text(item.quantity.toString(), 250);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 330);
      doc.text(`$${itemTotal.toFixed(2)}`, 450);
    });

    /* ---------- TOTAL ---------- */
    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(14);
    doc.text(`Grand Total: $${totalAmount.toFixed(2)}`, { align: "right" });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to export invoice" });
  }
});

export { router as salesRoutes };
