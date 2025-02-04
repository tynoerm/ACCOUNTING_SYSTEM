import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import cors from "cors";

const app = express();
app.use(express.json());
const corsOptions = {
  origin: 'https://accounting-system-qlz4.vercel.app', // Your actual frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(express.urlencoded({ extended: true })); 
app.use(cors(corsOptions));



// Connecting mongoDB Database
mongoose.connect("mongodb+srv://tinomutendaishemutemaringa:Z6UyvsaAHRwMTpR9@nexus.h6auc.mongodb.net/?retryWrites=true&w=majority&appName=nexus")
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
  })
  .catch((err) => {
    console.error("mongodb+srv://tinomutendaishemutemaringa:Z6UyvsaAHRwMTpR9@nexus.h6auc.mongodb.net/?retryWrites=true&w=majority&appName=nexus", err.reason);
  });


//Importing Routes

import { quotationRoutes } from './routes/SalesModule/quotation.js';
import { expensesRoutes } from './routes/ExpensesModule/expenses.js';
import { stocksRoutes } from './routes/StockModule/stocks.js';
import { salesRoutes } from './routes/SalesModule/sales.js';



//Route Use

app.use("/quotation", quotationRoutes);
app.use("/expense", expensesRoutes);
app.use("/stock", stocksRoutes);
app.use("/salesmodel", salesRoutes)





//Start Server
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log("Connection Established Successfully on " + port);
});

