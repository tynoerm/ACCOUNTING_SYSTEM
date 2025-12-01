// routes/salesRoutes.js
import express from "express";
import ExcelJS from "exceljs"; // left in case you use Excel exports elsewhere
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

import salesModel from "../../models/SalesModule/sales.js";
import stockModel from "../../models/StockModule/stocks.js";
import expensesModel from "../../models/ExpensesModule/expenses.js";

const router = express.Router();

/* ---------- CONFIG ---------- */
const LOGO_RELATIVE_PATH = "../../assets/hino_logo.jpg"; // <-- place your logo here
const COMPANY = {
  name: "HINO / XYZ Traders",
  address: "123 Main Street, Harare, Zimbabwe",
  phone: "+263 77 000 0000",
  email: "info@xyztraders.co.zw",
  website: "www.xyztraders.co.zw",
};

/* ================= CREATE SALE (also returns PDF base64 for immediate download) ================= */
router.post("/create-sale", async (req, res) => {
  try {
    const { items } = req.body;

    // Validate
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided for sale." });
    }

    // Deduct stock
    for (const soldItem of items) {
      try {
        const stockItem = await stockModel.findOne({
          itemDescription: soldItem.itemDescription,
        });

        if (stockItem) {
          stockItem.quantity -= soldItem.quantity;
          if (stockItem.quantity < 0) stockItem.quantity = 0;
          await stockItem.save();
        }
      } catch (err) {
        console.error("Stock deduction error for item:", soldItem, err);
      }
    }

    // Create sale document
    const result = await salesModel.create(req.body);

    // Generate PDF invoice as base64 and return with response
    const pdfBuffer = await generateInvoicePDFBuffer(result);
    const pdfBase64 = pdfBuffer.toString("base64");

    res.json({
      data: result,
      message: "Sale created successfully",
      invoiceBase64: pdfBase64,
      saleId: result._id,
    });
  } catch (error) {
    console.error("create-sale error:", error);
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
    console.error("get-stock-items error:", error);
    res.status(500).json({ message: "Failed to fetch stock items" });
  }
});

/* ================= GET SALES ================= */
router.get("/get-sales", async (req, res) => {
  try {
    const sales = await salesModel.find().sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    console.error("get-sales error:", error);
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
      try {
        const stockItem = await stockModel.findOne({
          itemDescription: soldItem.itemDescription,
        });

        if (stockItem) {
          stockItem.quantity += soldItem.quantity;
          await stockItem.save();
        }
      } catch (err) {
        console.error("Stock restore error for item:", soldItem, err);
      }
    }

    await salesModel.findByIdAndDelete(req.params.id);

    res.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("delete-sale error:", error);
    res.status(500).json({ message: "Failed to delete sale" });
  }
});

/* ================= EXPORT BEAUTIFUL PDF INVOICE (streamed download) ================= */
router.get("/export-sale-invoice/:id", async (req, res) => {
  try {
    const sale = await salesModel.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${sale._id}.pdf`
    );

    // Stream PDF directly to response
    doc.pipe(res);

    await writeInvoiceToDoc(doc, sale);

    doc.end();
  } catch (error) {
    console.error("export-sale-invoice error:", error);
    res.status(500).json({ message: "Failed to export invoice" });
  }
});

/* ===================== Helpers: generate PDF buffer (for create-sale) ===================== */
async function generateInvoicePDFBuffer(sale) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      // Write invoice content
      writeInvoiceToDoc(doc, sale)
        .then(() => doc.end())
        .catch((err) => {
          console.error("Error writing invoice to doc:", err);
          reject(err);
        });
    } catch (err) {
      reject(err);
    }
  });
}

/* ===================== Helpers: write invoice content into a PDFDocument ===================== */
async function writeInvoiceToDoc(doc, sale) {
  return new Promise((resolve) => {
    // Try load logo path either as project-relative or absolute
    let logoPathCandidate = path.resolve(LOGO_RELATIVE_PATH);
    if (!fs.existsSync(logoPathCandidate)) {
      // fallback: try relative to process.cwd()
      logoPathCandidate = path.join(process.cwd(), LOGO_RELATIVE_PATH);
    }

    // HEADER: logo on left, company + invoice title on right
    const headerTop = doc.y;
    if (fs.existsSync(logoPathCandidate)) {
      try {
        doc.image(logoPathCandidate, 40, headerTop, { width: 90, height: 90 });
      } catch (err) {
        console.warn("Could not place logo:", err);
      }
    } else {
      // console.info if logo missing
      console.info(`Logo not found at ${logoPathCandidate}. Header will render without logo.`);
    }

    // Company block next to logo
    const companyX = 140;
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#0b3d91")
      .text(COMPANY.name, companyX, headerTop, { continued: false });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#333")
      .text(COMPANY.address, companyX, doc.y + 4)
      .text(`Phone: ${COMPANY.phone}`, companyX)
      .text(`Email: ${COMPANY.email}`, companyX)
      .text(COMPANY.website, companyX);

    // Invoice title to the right
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#0b3d91")
      .text("SALES INVOICE", { align: "right" });

    doc.moveDown(1);

    // Horizontal line
    doc
      .strokeColor("#0b3d91")
      .lineWidth(1.5)
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .stroke();

    doc.moveDown(1.2);

    // Invoice / sale meta
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#000").text("Invoice Details");
    doc.moveDown(0.6);

    // Left column: invoice fields
    const leftColumnX = 40;
    const rightColumnX = 320;
    const startY = doc.y;

    doc.font("Helvetica").fontSize(11);
    doc.text(`Invoice ID: `, leftColumnX, startY, { continued: true }).font("Helvetica-Bold").text(`${sale._id}`);
    doc.font("Helvetica").text(`Customer: `, leftColumnX, doc.y, { continued: true }).font("Helvetica-Bold").text(`${sale.customerName || "Walk-in"}`);
    doc.font("Helvetica").text(`Date: `, leftColumnX, doc.y, { continued: true }).font("Helvetica-Bold").text(`${new Date(sale.date).toLocaleString()}`);

    // Right column: cashier/payment
    doc.font("Helvetica").fontSize(11).text(`Cashier: `, rightColumnX, startY, { continued: true }).font("Helvetica-Bold").text(`${sale.cashierName || "N/A"}`);
    doc.font("Helvetica").text(`Payment: `, rightColumnX, doc.y, { continued: true }).font("Helvetica-Bold").text(`${sale.paymentMethod || "N/A"}`);
    doc.moveDown(1);

    // Items table header
    doc.moveDown(0.3);
    const tableTop = doc.y;
    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Item", 40, tableTop);
    doc.text("Qty", 300, tableTop);
    doc.text("Unit Price", 350, tableTop);
    doc.text("VAT%", 430, tableTop);
    doc.text("Total", 500, tableTop);

    doc.moveDown(0.3);
    doc.strokeColor("#bfbfbf").lineWidth(0.8).moveTo(40, doc.y).lineTo(555, doc.y).stroke();

    // Table rows
    doc.font("Helvetica").fontSize(11);
    let posY = doc.y + 6;
    let subtotal = 0;
    let totalVatAmount = 0;

    sale.items.forEach((item, idx) => {
      const itemTotal = (item.unitPrice || 0) * (item.quantity || 0);
      const itemVat = ((item.vat || 0) / 100) * itemTotal;
      subtotal += itemTotal;
      totalVatAmount += itemVat;

      // wrap long description by limiting width
      doc.text(`${idx + 1}. ${item.itemDescription}`, 40, posY, { width: 250 });
      doc.text(item.quantity.toString(), 300, posY);
      doc.text(`$${(item.unitPrice || 0).toFixed(2)}`, 350, posY);
      doc.text(`${(item.vat || 0).toString()}%`, 430, posY);
      doc.text(`$${(itemTotal + itemVat).toFixed(2)}`, 500, posY);

      const rowHeight = 16;
      posY += rowHeight;

      // if we are near the page bottom, add new page header
      if (posY > 720) {
        doc.addPage();
        posY = 50;
      }
      doc.y = posY;
    });

    // Totals block
    doc.moveDown(1.5);
    const totalsY = doc.y;
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text(`Subtotal: `, 400, totalsY, { continued: true }).font("Helvetica").text(`$${subtotal.toFixed(2)}`);
    doc.font("Helvetica-Bold").text(`VAT Total: `, 400, doc.y, { continued: true }).font("Helvetica").text(`$${totalVatAmount.toFixed(2)}`);
    const grandTotal = subtotal + totalVatAmount;
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#0b3d91").text(`Grand Total: $${grandTotal.toFixed(2)}`, 400, doc.y);

    // Footer / notes
    doc.moveDown(2);
    doc.font("Helvetica").fontSize(10).fillColor("#333").text("Thank you for your business!", 40);
    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(9).fillColor("#666").text("This is a computer generated invoice and does not require a signature.", 40);

    resolve();
  });
}

export { router as salesRoutes };

