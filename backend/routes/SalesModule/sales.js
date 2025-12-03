// routes/SalesModule/sales.js
import express from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Models
import salesModel from "../../models/SalesModule/sales.js";
import stockModel from "../../models/StockModule/stocks.js";
import expensesModel from "../../models/ExpensesModule/expenses.js";

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/* ---------------------- COMPANY CONFIG ---------------------- */
const LOGO_PATH = path.join(__dirname, "../../assets/hino_logo.jpg");

const COMPANY = {
  name: "Tinphil Investments",
  address: "12 Mutley Bend Harare, Zimbabwe",
  phone: "+263 774 742 212",
  email: "tinphilinvestment@gmail.com",
};

/* ---------------------- INVOICE NUMBER ---------------------- */
async function generateInvoiceNumber() {
  const lastInvoice = await salesModel.findOne().sort({ createdAt: -1 });
  if (!lastInvoice || !lastInvoice.invoiceId) return "INV001";

  const lastNumber = parseInt(lastInvoice.invoiceId.replace("INV", ""));
  return "INV" + String(lastNumber + 1).padStart(3, "0");
}

/* ---------------------- CREATE SALE ------------------------- */
router.post("/create-sale", async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "No items provided for sale." });

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

    const invoiceId = await generateInvoiceNumber();

    const sale = await salesModel.create({
      ...req.body,
      invoiceId,
    });

    const pdfBuffer = await generateInvoicePDFBuffer(sale);
    const pdfBase64 = pdfBuffer.toString("base64");

    res.json({
      data: sale,
      message: "Sale created successfully",
      invoiceBase64: pdfBase64,
      saleId: sale._id,
    });
  } catch (err) {
    console.error("create-sale error:", err);
    res.status(500).json({ message: "Failed to create sale" });
  }
});

/* ---------------------- GET STOCK ITEMS ---------------------- */
router.get("/get-stock-items", async (req, res) => {
  try {
    const stocks = await stockModel.find(
      { quantity: { $gt: 0 } },
      "itemDescription unitPrice quantity"
    );
    res.json(stocks);
  } catch (err) {
    console.error("get-stock-items error:", err);
    res.status(500).json({ message: "Failed to fetch stock items" });
  }
});

/* ---------------------- GET SALES ----------------------------- */
router.get("/get-sales", async (req, res) => {
  try {
    const sales = await salesModel.find().sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    console.error("get-sales error:", err);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

/* ---------------------- DELETE SALE --------------------------- */
router.delete("/delete-sale/:id", async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    for (const item of sale.items) {
      const stockItem = await stockModel.findOne({
        itemDescription: item.itemDescription,
      });

      if (stockItem) {
        stockItem.quantity += item.quantity;
        await stockItem.save();
      }
    }

    await salesModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Sale deleted successfully" });
  } catch (err) {
    console.error("delete-sale error:", err);
    res.status(500).json({ message: "Failed to delete sale" });
  }
});

/* ---------------------- STREAM PDF --------------------------- */
router.get("/export-sale-invoice/:id", async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${sale.invoiceId || sale._id}.pdf`
    );

    doc.pipe(res);

    await writeInvoiceToDoc(doc, sale);

    doc.end();
  } catch (err) {
    console.error("export-sale-invoice error:", err);
    res.status(500).json({ message: "Failed to export invoice" });
  }
});

/* ---------------- PDF BUFFER FOR CREATE-SALE ---------------- */
function generateInvoicePDFBuffer(sale) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    writeInvoiceToDoc(doc, sale)
      .then(() => doc.end())
      .catch(reject);
  });
}

/* ---------------- PDF GENERATOR FUNCTION -------------------- */
function writeInvoiceToDoc(doc, sale) {
  return new Promise((resolve) => {
    // Debug logo path
    console.log("LOGO PATH:", LOGO_PATH);
    console.log("Exists:", fs.existsSync(LOGO_PATH));

    /* ------------ HEADER ------------- */
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 40, 30, { width: 120 });
    }

    doc.font("Helvetica-Bold").fontSize(22).fillColor("#1f3c88")
      .text(COMPANY.name, 200, 30);

    doc.font("Helvetica").fontSize(10)
      .text(COMPANY.address, 200, 55)
      .text(`Phone: ${COMPANY.phone}`, 200, 70)
      .text(`Email: ${COMPANY.email}`, 200, 85);

    doc.font("Helvetica-Bold").fontSize(30).fillColor("#1f3c88")
      .text("INVOICE", 0, 30, { align: "right" });

    doc.moveTo(40, 130).lineTo(555, 130).lineWidth(2).strokeColor("#1f3c88").stroke();

    /* ------------ INVOICE INFO ------------- */
    doc.font("Helvetica").fillColor("#000").fontSize(11);

    doc.text(`Invoice ID: `, 40, 150, { continued: true })
      .font("Helvetica-Bold")
      .text(sale.invoiceId);

    doc.font("Helvetica").text(`Customer: `, 40, 165, { continued: true })
      .font("Helvetica-Bold")
      .text(sale.customerName || "Walk-in");

    doc.font("Helvetica").text(`Date: `, 40, 180, { continued: true })
      .font("Helvetica-Bold")
      .text(new Date(sale.date).toLocaleString());

    doc.moveDown(2);

    /* ------------ TABLE HEADER ------------- */
    const tableTop = doc.y + 10;

    doc.rect(40, tableTop, 515, 25).fill("#1f3c88");

    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(11);
    doc.text("Item", 50, tableTop + 7);
    doc.text("Qty", 280, tableTop + 7);
    doc.text("Unit Price", 330, tableTop + 7);
    doc.text("VAT%", 430, tableTop + 7);
    doc.text("Total", 510, tableTop + 7, { align: "right" });

    let posY = tableTop + 30;
    let subtotal = 0;
    let totalVat = 0;

    doc.fillColor("#000").font("Helvetica").fontSize(10);

    sale.items.forEach((item, index) => {
      if (index % 2 === 0) doc.rect(40, posY - 2, 515, 22).fill("#f5f6fa");

      const total = item.quantity * item.unitPrice;
      const vat = (item.vat / 100) * total;

      subtotal += total;
      totalVat += vat;

      doc.fillColor("#000");
      doc.text(item.itemDescription, 50, posY);
      doc.text(item.quantity, 285, posY);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 330, posY);
      doc.text(`${item.vat}%`, 430, posY);
      doc.text(`$${(total + vat).toFixed(2)}`, 500, posY, { width: 50, align: "right" });

      posY += 24;
    });

    /* ------------ TOTALS ------------- */
    const grandTotal = subtotal + totalVat;

    doc.rect(300, posY + 10, 255, 90).fill("#1f3c88");

    doc.fillColor("#fff").font("Helvetica").fontSize(11);
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 310, posY + 20);
    doc.text(`Vat Total: $${totalVat.toFixed(2)}`, 310, posY + 40);

    doc.font("Helvetica-Bold").fontSize(14)
      .text(`Grand Total: $${grandTotal.toFixed(2)}`, 310, posY + 65);

    /* ------------ FOOTER ------------- */
    doc.moveDown(4);

    doc.fillColor("#444").fontSize(10)
      .text("Thank you for your business!", 40);

    doc.fontSize(9).fillColor("#777")
      .text("This is a computer generated invoice and does not require a signature.", 40);

    resolve();
  });
}

export { router as salesRoutes };
