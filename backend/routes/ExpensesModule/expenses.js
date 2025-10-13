import express from "express";
import ExcelJS from "exceljs";
import Expenses from "../../models/ExpensesModule/expenses.js";

const router = express.Router();

/**
 * @route   POST /api/expenses/create-expense
 * @desc    Create a new expense record
 */
router.post("/create-expense", async (req, res) => {
  try {
    const expense = await Expenses.create(req.body);
    res.json({ data: expense, message: "Record created successfully", status: 200 });
  } catch (err) {
    console.error("❌ Error creating expense:", err);
    res.status(500).json({ message: "Error creating expense", status: 500 });
  }
});

/**
 * @route   GET /api/expenses
 * @desc    Fetch all expenses
 */
router.get("/", async (req, res) => {
  try {
    const expenses = await Expenses.find().sort({ date: -1 });
    res.json({ data: expenses, message: "Expenses fetched successfully", status: 200 });
  } catch (err) {
    console.error("❌ Error fetching expenses:", err);
    res.status(500).json({ message: "Error fetching expenses", status: 500 });
  }
});

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete an expense by ID
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Expenses.findByIdAndDelete(id);
    res.json({ message: "Expense deleted successfully", status: 200 });
  } catch (err) {
    console.error("❌ Error deleting expense:", err);
    res.status(500).json({ message: "Error deleting expense", status: 500 });
  }
});

/**
 * @route   GET /api/expenses/download/excel
 * @desc    Export expenses to Excel
 * @query   date (optional)
 */
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

    const expenses = await Expenses.find(query).sort({ date: 1 });
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

    expenses.forEach((expense, index) => {
      worksheet.addRow({
        no: index + 1,
        date: expense.date ? expense.date.toISOString().split("T")[0] : "N/A",
        issuedTo: expense.issuedTo || "N/A",
        description: expense.description || "N/A",
        paymentMethod: expense.paymentMethod || "N/A",
        expenseType: expense.expenseType || "N/A",
        amount: expense.amount ? expense.amount.toFixed(2) : "0.00",
        authorisedBy: expense.authorisedBy || "N/A",
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    const fileName = date ? `expenses_${date}.xlsx` : "expenses.xlsx";
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("❌ Error generating Excel:", err);
    res.status(500).send("Error generating Excel file");
  }
});

export { router as expensesRoutes };
