import express from "express";
import ExcelJS from "exceljs";
import salesModel from "../../models/SalesModule/sales.js";
import stockModel from "../../models/StockModule/stocks.js";
import expensesModel from "../../models/ExpensesModule/expenses.js";

const router = express.Router();

/* ================= CREATE SALE ================= */
router.post("/create-sale", async (req, res) => {
  try {
    const { items } = req.body;

    // Deduct stock quantities automatically
    for (const soldItem of items) {
      const stockItem = await stockModel.findOne({ itemDescription: soldItem.itemDescription });
      if (stockItem) {
        stockItem.quantity -= soldItem.quantity;
        if (stockItem.quantity < 0) stockItem.quantity = 0;
        await stockItem.save();
      }
    }

    const result = await salesModel.create(req.body);
    res.json({ data: result, message: "✅ Sale record created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create sale" });
  }
});

/* ================= GET STOCK ITEMS ================= */
router.get("/get-stock-items", async (req, res) => {
  try {
    const stocks = await stockModel.find({ quantity: { $gt: 0 } }, "itemDescription unitPrice quantity");
    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch stock items" });
  }
});

/* ================= GET ALL SALES ================= */
router.get("/get-sales", async (req, res) => {
  try {
    const sales = await salesModel.find().sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
});

/* ================= GET ALL EXPENSES ================= */
router.get("/get-expenses", async (req, res) => {
  try {
    const expenses = await expensesModel.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
});

/* ================= EXPORT REPORT TO EXCEL ================= */
router.get("/export-report", async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales & Expenses");

    worksheet.addRow(["SALES REPORT"]);
    worksheet.addRow(["Date","Customer Name","Item Description","Quantity","Unit Price","Total"]);

    const sales = await salesModel.find().sort({ date: 1 });
    let totalSalesAmount = 0;
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        totalSalesAmount += Number(item.totalPrice);
        worksheet.addRow([
          new Date(sale.date).toLocaleDateString(),
          sale.customerName,
          item.itemDescription,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
        ]);
      });
    });
    worksheet.addRow([]);
    worksheet.addRow(["", "", "", "", "TOTAL SALES", totalSalesAmount]);
    worksheet.addRow([]);

    worksheet.addRow(["EXPENSES REPORT"]);
    worksheet.addRow(["Date","Issued To","Description","Payment Method","Expense Type","Amount"]);

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
    worksheet.addRow([]);
    worksheet.addRow(["", "", "", "", "TOTAL EXPENSES", totalExpensesAmount]);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Sales_Expenses_Report.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to export report" });
  }
});

export { router as salesRoutes };
