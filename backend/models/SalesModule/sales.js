import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const saleItemSchema = new Schema({
  itemDescription: String,
  quantity: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  vat: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
});

const salesSchema = new Schema(
  {
    date: { type: Date, default: Date.now },
    cashierName: String,
    customerName: String,
    paymentMethod: String,
    currency: String,
    balance: { type: Number, default: 0 },

    // 👇 Now supports multiple items in one sale
    items: [saleItemSchema],

    subtotal: { type: Number, default: 0 },
    vatAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
  },
  {
    collection: "salesmodel",
  }
);

export default model("salesmodel", salesSchema);
