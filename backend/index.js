import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Fix: Allow OPTIONS preflight, credentials, and all headers
const corsOptions = {
  origin: 'https://accounting-system-seven.vercel.app', // Your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // include OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization'], // allow needed headers
  credentials: true, // allow cookies/auth headers
  optionsSuccessStatus: 200 // prevent issues with legacy browsers
};

app.use(cors(corsOptions));

// ✅ Handle OPTIONS preflight globally
app.options('*', cors(corsOptions));

// MongoDB Connection
mongoose.connect(
  'mongodb+srv://accountingsystem:BVSeFcaSdMQNTDPk@cluster0.tkqyx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 40000,
    socketTimeoutMS: 40000,
  }
)
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
  })
  .catch((err) => {
    console.error('MongoDB connection error: ', err);
  });

// Import Routes
import { quotationRoutes } from './routes/SalesModule/quotation.js';
import { expensesRoutes } from './routes/ExpensesModule/expenses.js';
import { stocksRoutes } from './routes/StockModule/stocks.js';
import { salesRoutes } from './routes/SalesModule/sales.js';
import { usersRoutes } from './routes/UsersModule/users.js';

// Use Routes
app.use('/quotation', quotationRoutes);
app.use('/expense', expensesRoutes);
app.use('/stock', stocksRoutes);
app.use('/salesmodel', salesRoutes);
app.use('/users', usersRoutes);

// Start Server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log('Connection Established Successfully on ' + port);
});

