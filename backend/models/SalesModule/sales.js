import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  itemDescription: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  vat: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
});

const salesSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  cashierName: { type: String, required: true },

  // NOW OPTIONAL
  customerName: { type: String, default: null },

  paymentMethod: { type: String, required: true },

  // NOW OPTIONAL
  currency: { type: String, default: null },

  balance: { type: Number, default: 0 },
  items: [itemSchema],
  subtotal: { type: Number, required: true },
  vatAmount: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
}, { timestamps: true });

const salesModel = mongoose.model("Sale", salesSchema);

export default salesModel;
