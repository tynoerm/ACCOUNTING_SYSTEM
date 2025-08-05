// users.model.js
import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

const usersSchema = new Schema({
  fullname: { type: String, required: true, trim: true },
  username: { type: String, required: true},
  
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['client', 'deptmanager', 'hr', 'itmanagement'], 
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
