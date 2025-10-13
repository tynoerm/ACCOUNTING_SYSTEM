import express from "express";
import ExcelJS from "exceljs";
import salesModel from "../../models/SalesModule/sales.js";
import expensesModel from "../../models/ExpensesModule/expenses.js";

const router = express.Router();

/* =========================
   📌 CREATE SALES RECORD
========================= */
router.post("/create-sale", async (req, res) => {
  try {
    const result = await salesModel.create(req.body);
    res.json({ data: result, message: "Sale record created successfully ✅" });
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ message: "Failed to create sale" });
  }
});

/* =========================
   📌 CREATE EXPENSE RECORD
========================= */
router.post("/create-expense", async (req, res) => {
  try {
    const result = await expensesModel.create(req.body);
    res.json({ data: result, message: "Expense record created successfully ✅" });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Failed to create expense" });
  }
});

/* =========================
   📌 GET ALL SALES
========================= */
router.get("/get-sales", async (req, res) => {
  try {
    const sales = await salesModel.find().sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

/* =========================
   📌 GET ALL EXPENSES
========================= */
router.get("/get-expenses", async (req, res) => {
  try {
    const expenses = await expensesModel.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
});

/* =========================
   📌 EXPORT SALES + EXPENSES TO ONE EXCEL SHEET
========================= */
router.get("/export-report", async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales & Expenses");

    // ================= SALES SECTION =================
    worksheet.addRow(["SALES REPORT"]);
    worksheet.addRow([
      "Date",
      "Customer Name",
      "Description",
      "Quantity",
      "Unit Price",
      "Total Amount",
    ]);

    const sales = await salesModel.find().sort({ date: 1 });
    let totalSalesAmount = 0;

    sales.forEach((sale) => {
      totalSalesAmount += Number(sale.totalAmount);
      worksheet.addRow([
        new Date(sale.date).toLocaleDateString(),
        sale.customerName,
        sale.description,
        sale.quantity,
        sale.unitPrice,
        sale.totalAmount,
      ]);
    });

    // Add total row for sales
    worksheet.addRow([]);
    worksheet.addRow(["", "", "", "", "TOTAL SALES", totalSalesAmount]);
    worksheet.addRow([]); // Empty row between sections

    // ================= EXPENSES SECTION =================
    worksheet.addRow(["EXPENSES REPORT"]);
    worksheet.addRow([
      "Date",
      "Issued To",
      "Description",
      "Payment Method",
      "Expense Type",
      "Amount",
    ]);

    const expenses = await expensesModel.find().sort({ date: 1 });
    let totalExpensesAmount = 0;

    expenses.forEach((expense) => {
      totalExpensesAmount += Number(expense.amount);
      worksheet.addRow([
        new Date(expense.date).toLocaleDateString(),
        expense.issuedTo,
        expense.description,
        expense.paymentMethod,
        expense.expenseType,
        expense.amount,
      ]);
    });

    // Add total row for expenses
    worksheet.addRow([]);
    worksheet.addRow(["", "", "", "", "TOTAL EXPENSES", totalExpensesAmount]);

    // ================= RESPONSE =================
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Sales_Expenses_Report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting report:", error);
    res.status(500).json({ message: "Failed to export report" });
  }
});

export default router;
