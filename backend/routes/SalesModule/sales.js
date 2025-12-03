// routes/salesRoutes.js
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

/* -----------------------------------------------------------
   FIXED LOGO PATH (GUARANTEED TO WORK)
----------------------------------------------------------- */

// Primary path: backend/assets/hino.jpg
let LOGO_PATH = path.join(__dirname, "../assets/hino.jpg");

// Fallback path: process.cwd() + backend/assets
if (!fs.existsSync(LOGO_PATH)) {
  console.warn("Primary logo path failed:", LOGO_PATH);
  LOGO_PATH = path.join(process.cwd(), "backend/assets/hino.jpg");
}

if (!fs.existsSync(LOGO_PATH)) {
  console.warn("Logo STILL not found! Check your asset location.");
}

const COMPANY = {
  name: "Tinphil Investments",
  address: "12 Mutley Bend Harare, Zimbabwe",
  phone: "+263 774 742 212",
  email: "tinphilinvestment@gmail.com",
};

/* ============================================================
   AUTO GENERATE INVOICE NUMBER
============================================================ */
async function generateInvoiceNumber() {
  const lastInvoice = await salesModel.findOne().sort({ createdAt: -1 });
  if (!lastInvoice || !lastInvoice.invoiceId) return "INV001";

  const lastNumber = parseInt(lastInvoice.invoiceId.replace("INV", ""));
  const nextNumber = lastNumber + 1;
  return "INV" + nextNumber.toString().padStart(3, "0");
}

/* ============================================================
   CREATE SALE + RETURN BASE64 PDF
============================================================ */
router.post("/create-sale", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "No items provided for sale." });

    // Deduct Stock
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

    const result = await salesModel.create({
      ...req.body,
      invoiceId,
    });

    const pdfBuffer = await generateInvoicePDFBuffer(result);
    const pdfBase64 = pdfBuffer.toString("base64");

    res.json({
      data: result,
      message: "Sale created successfully",
      invoiceBase64: pdfBase64,
      saleId: result._id,
    });

  } catch (err) {
    console.error("create-sale error:", err);
    res.status(500).json({ message: "Failed to create sale" });
  }
});

/* ============================================================
   GET STOCK ITEMS
============================================================ */
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

/* ============================================================
   GET SALES
============================================================ */
router.get("/get-sales", async (req, res) => {
  try {
    const sales = await salesModel.find().sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    console.error("get-sales error:", err);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

/* ============================================================
   DELETE SALE + RESTORE STOCK
============================================================ */
router.delete("/delete-sale/:id", async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

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

  } catch (err) {
    console.error("delete-sale error:", err);
    res.status(500).json({ message: "Failed to delete sale" });
  }
});

/* ============================================================
   STREAM PDF INVOICE TO FRONTEND
============================================================ */
router.get("/export-sale-invoice/:id", async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${sale.invoiceId}.pdf`
    );

    doc.pipe(res);
    await writeInvoiceToDoc(doc, sale);
    doc.end();

  } catch (err) {
    console.error("export-sale-invoice error:", err);
    res.status(500).json({ message: "Failed to export invoice" });
  }
});

/* ------------------------------------------------------------
   Generate PDF Buffer
------------------------------------------------------------ */
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

/* ------------------------------------------------------------
   PREMUIM PDF LAYOUT + LOGO FIXED
------------------------------------------------------------ */
function writeInvoiceToDoc(doc, sale) {
  return new Promise((resolve) => {

    /* ----- Load Logo ----- */
    if (fs.existsSync(LOGO_PATH)) {
      try {
        doc.image(LOGO_PATH, 40, 40, { width: 120 });
      } catch (err) {
        console.warn("Logo display failed:", err);
      }
    } else {
      console.warn("Logo NOT found:", LOGO_PATH);
    }

    /* ----- Company Info ----- */
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#1f3c88")
      .text(COMPANY.name, 180, 40);

    doc.font("Helvetica").fontSize(10).fillColor("#444")
      .text(COMPANY.address, 180, 70)
      .text(`Phone: ${COMPANY.phone}`)
      .text(`Email: ${COMPANY.email}`);

    doc.font("Helvetica-Bold").fontSize(28).fillColor("#1f3c88")
      .text("INVOICE", 0, 40, { align: "right" });

    doc.moveTo(40, 160).lineTo(555, 160).lineWidth(2).strokeColor("#1f3c88").stroke();
    doc.moveDown(2);

    /* ----- Invoice Details ----- */
    doc.font("Helvetica").fontSize(11).fillColor("#333");
    doc.text(`Invoice ID: ${sale.invoiceId}`);
    doc.text(`Customer: ${sale.customerName || "Walk-in"}`);
    doc.text(`Date: ${new Date(sale.date).toLocaleString()}`);

    doc.moveDown(1);

    /* ----- Table Header ----- */
    const tableTop = doc.y + 10;
    doc.rect(40, tableTop, 515, 25).fill("#1f3c88");

    doc.fillColor("#fff").fontSize(11).font("Helvetica-Bold");
    doc.text("Item", 50, tableTop + 7);
    doc.text("Qty", 260, tableTop + 7);
    doc.text("Unit Price", 310, tableTop + 7);
    doc.text("VAT%", 400, tableTop + 7);
    doc.text("Total", 520, tableTop + 7, { align: "right" });

    /* ----- Table Body ----- */
    let posY = tableTop + 30;
    let subtotal = 0;
    let totalVat = 0;

    sale.items.forEach((item, index) => {
      if (index % 2 === 0) doc.rect(40, posY - 2, 515, 22).fill("#f4f4f6");

      const total = item.unitPrice * item.quantity;
      const vat = (item.vat / 100) * total;

      subtotal += total;
      totalVat += vat;

      doc.fillColor("#000").font("Helvetica").fontSize(10);
      doc.text(item.itemDescription, 50, posY);
      doc.text(item.quantity, 260, posY);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 310, posY);
      doc.text(`${item.vat}%`, 400, posY);
      doc.text(`$${(total + vat).toFixed(2)}`, 490, posY, { width: 70, align: "right" });

      posY += 24;
    });

    /* ----- Totals Box ----- */
    const grandTotal = subtotal + totalVat;

    doc.rect(300, posY + 10, 255, 90).fill("#1f3c88");
    doc.fillColor("#fff").fontSize(11);

    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 310, posY + 20);
    doc.text(`VAT Total: $${totalVat.toFixed(2)}`, 310, posY + 40);
    doc.font("Helvetica-Bold").fontSize(14)
      .text(`Grand Total: $${grandTotal.toFixed(2)}`, 310, posY + 65);

    /* ----- Footer ----- */
    doc.fillColor("#444").fontSize(10).moveDown(4);
    doc.text("Thank you for your business!");

    resolve();
  });
}

export { router as salesRoutes };
