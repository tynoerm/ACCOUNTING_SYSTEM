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

export { router as salesRoutes };
