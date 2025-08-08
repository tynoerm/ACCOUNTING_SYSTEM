import mongoose from 'mongoose';

const { Schema, model } = mongoose; // ✅ Destructure Schema and model from mongoose

const usersSchema = new Schema({
  fullName: { type: String, required: true, trim: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['clerk', 'admin'],
    required: true
  },
  storename: {
    type: String,
    enum: ['gweru', 'kaguvi', 'admin'],
    required: true
  },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

export default model('users', usersSchema);
