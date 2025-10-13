import mongoose from "mongoose";
import express from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import expensesSchema from "../../models/ExpensesModule/expenses.js";

let router = express.Router();

// ✅ CREATE an expense
router.post("/create-expense", async (req, res) => {
  try {
    const result = await expensesSchema.create(req.body);
    res.json({ data: result, message: "record created successfully", status: 200 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating expense", status: 500 });
  }
});

// ✅ GET all expenses
router.get("/", async (req, res) => {
  try {
    const result = await expensesSchema.find().sort({ date: -1 });
    res.json({ data: result, message: "expenses fetched successfully", status: 200 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching expenses", status: 500 });
  }
});

// ✅ DELETE an expense
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await expensesSchema.findByIdAndDelete(id);
    res.json({ message: "Expense deleted successfully", status: 200 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting expense", status: 500 });
  }
});

// ✅ Excel download route
router.get("/download/excel", async (req, res) => {
  try {
    const { date } = req.query;
    const query = {};
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const files = await expensesSchema.find(query).sort({ date: 1 });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Expense Report");

    worksheet.columns = [
      { header: "No.", key: "no", width: 5 },
      { header: "Date", key: "date", width: 15 },
      { header: "Issued To", key: "issuedTo", width: 20 },
      { header: "Description", key: "description", width: 30 },
      { header: "Payment Method", key: "paymentMethod", width: 20 },
      { header: "Expense Type", key: "expenseType", width: 20 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Authorized By", key: "authorisedBy", width: 20 },
    ];

    files.forEach((file, index) => {
      worksheet.addRow({
        no: index + 1,
        date: file.date ? file.date.toISOString().split("T")[0] : "N/A",
        issuedTo: file.issuedTo || "N/A",
        description: file.description || "N/A",
        paymentMethod: file.paymentMethod || "N/A",
        expenseType: file.expenseType || "N/A",
        amount: file.amount ? file.amount.toFixed(2) : "0.00",
        authorisedBy: file.authorisedBy || "N/A",
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    const fileName = date ? `expenses_${date}.xlsx` : "expenses.xlsx";
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating Excel file");
  }
});

export { router as expensesRoutes };
