import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true })); 




// Connecting mongoDB Database
mongoose.connect("mongodb://127.0.0.1:27017/ACCOUNTING_SYSTEM")
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
  })
  .catch((err) => {
    console.error("mongodb://localhost:27017/", err.reason);
  });


//Importing Routes

import { quotationRoutes } from './routes/SalesModule/quotation.js';
import { expensesRoutes } from './routes/ExpensesModule/expenses.js';
import { stocksRoutes } from './routes/StockModule/stocks.js';
import { salesRoutes } from './routes/SalesModule/sales.js';
import { invoiceRoutes } from './routes/SalesModule/invoice.js';


//Route Use

app.use("/quotation", quotationRoutes);
app.use("/expense", expensesRoutes);
app.use("/stock", stocksRoutes);
app.use("/salesmodel", salesRoutes)

app.use('/invoice', invoiceRoutes);



//Start Server
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log("Connection Established Successfully on " + port);
});

