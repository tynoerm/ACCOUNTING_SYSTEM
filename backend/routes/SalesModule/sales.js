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

/* ---------------------- Company config ---------------------- */
const LOGO_RELATIVE_PATH = path.resolve(
  __dirname,
  "../../assets/hino.jpg"
);

const COMPANY = {
  name: "Tinphil Investments",
  address: "12 Mutley Bend Harare, Zimbabwe",
  phone: "+263 774 742 212",
  email: "tinphilinvestment@gmail.com"
};

/* ============================================================
   AUTO GENERATE INVOICE NUMBER (INV001, INV002 ...)
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

    const newInvoiceId = await generateInvoiceNumber();

    const result = await salesModel.create({
      ...req.body,
      invoiceId: newInvoiceId,
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

/* ------------------------------------------------------------
   Generate PDF as Buffer
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
   BEAUTIFUL PDF (Fixed Header)
------------------------------------------------------------ */
function writeInvoiceToDoc(doc, sale) {
  return new Promise((resolve) => {
    let logoPath = LOGO_RELATIVE_PATH;
    if (!fs.existsSync(logoPath)) {
      logoPath = path.join(process.cwd(), "assets/hino.jpg");
    }

    /* ---------------- HEADER ---------------- */

    let logoBottomY = 40; // default top padding

    if (fs.existsSync(logoPath)) {
      try {
        const img = doc.openImage(logoPath);

        // scale width to 120
        const scaledHeight = (img.height / img.width) * 120;

        doc.image(logoPath, 40, 40, { width: 120 });

        logoBottomY = 40 + scaledHeight;
      } catch (err) {
        console.warn("Logo load failed:", err);
      }
    }

    // Company Info
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#1f3c88")
      .text(COMPANY.name, 180, 40);

    doc.font("Helvetica").fontSize(10).fillColor("#444")
      .text(COMPANY.address, 180, 70)
      .text(`Phone: ${COMPANY.phone}`)
      .text(`Email: ${COMPANY.email}`);

    // Invoice title
    doc.font("Helvetica-Bold").fontSize(30).fillColor("#1f3c88")
      .text("INVOICE", 0, 40, { align: "right" });

    // Divider placed perfectly below logo
    const dividerY = logoBottomY + 20;

    doc.moveTo(40, dividerY)
      .lineTo(555, dividerY)
      .lineWidth(2)
      .strokeColor("#1f3c88")
      .stroke();

    doc.y = dividerY + 25;

    /* ---------------- INVOICE INFO ---------------- */
    const leftX = 40;
    const rightX = 330;

    doc.font("Helvetica").fontSize(11).fillColor("#333");

    doc.text("Invoice ID: ", leftX, doc.y, { continued: true })
      .font("Helvetica-Bold").text(sale.invoiceId);

    doc.text("Customer: ", leftX, doc.y, { continued: true })
      .font("Helvetica-Bold").text(sale.customerName || "Walk-in");

    doc.text("Date: ", leftX, doc.y, { continued: true })
      .font("Helvetica-Bold")
      .text(new Date(sale.date).toLocaleString());

    doc.text("Cashier: ", rightX, doc.y - 55, { continued: true })
      .font("Helvetica-Bold").text(sale.cashierName || "N/A");

    doc.text("Payment Method: ", rightX, doc.y, { continued: true })
      .font("Helvetica-Bold").text(sale.paymentMethod || "N/A");

    doc.moveDown(1.5);

    /* ---------------- TABLE ---------------- */
    const tableTop = doc.y + 5;

    doc.rect(40, tableTop, 515, 25).fill("#1f3c88");
    doc.fillColor("#fff").font("Helvetica-Bold").fontSize(11);
    doc.text("Item", 50, tableTop + 7);
    doc.text("Qty", 280, tableTop + 7);
    doc.text("Unit Price", 330, tableTop + 7);
    doc.text("VAT%", 430, tableTop + 7);
    doc.text("Total", 510, tableTop + 7, { align: "right" });

    doc.fillColor("#000");
    let posY = tableTop + 30;

    let subtotal = 0;
    let totalVat = 0;

    sale.items.forEach((item, index) => {
      if (index % 2 === 0) doc.rect(40, posY - 2, 515, 22).fill("#f5f6fa");
      doc.fillColor("#000");

      const total = item.unitPrice * item.quantity;
      const vat = (item.vat / 100) * total;

      subtotal += total;
      totalVat += vat;

      doc.font("Helvetica").fontSize(10);
      doc.text(item.itemDescription, 50, posY);
      doc.text(item.quantity, 285, posY);
      doc.text(`$${item.unitPrice.toFixed(2)}`, 330, posY);
      doc.text(`${item.vat}%`, 430, posY);
      doc.text(`$${(total + vat).toFixed(2)}`, 500, posY, {
        width: 50,
        align: "right",
      });

      posY += 24;

      if (posY > 720) {
        doc.addPage();
        posY = 50;
      }
    });

    /* ---------------- TOTALS ---------------- */
    const grandTotal = subtotal + totalVat;

    doc.rect(300, posY + 10, 255, 90).fill("#1f3c88");
    doc.fillColor("#fff").fontSize(11);
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 310, posY + 20);
    doc.text(`VAT Total: $${totalVat.toFixed(2)}`, 310, posY + 40);
    doc.font("Helvetica-Bold").fontSize(14)
      .text(`Grand Total: $${grandTotal.toFixed(2)}`, 310, posY + 65);

    /* ---------------- FOOTER ---------------- */
    doc.moveDown(4);
    doc.fillColor("#444").font("Helvetica").fontSize(10);
    doc.text("Thank you for your business!", 40);
    doc.fontSize(9).fillColor("#777")
      .text("This is a computer generated invoice and does not require a signature.", 40);

    resolve();
  });
}

export { router as salesRoutes };
