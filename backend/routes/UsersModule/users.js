import express from "express";
import bcrypt from "bcryptjs"; // Password hashing (optional, but highly recommended)
import usersSchema from "../models/UsersModule/users.js";

const router = express.Router();

// REGISTER USER
router.post("/create-user", async (req, res, next) => {
  try {
    const { fullname, username, storename, role, password} = req.body;

    // Check if employerNumber already exists
    const existingUser = await usersSchema.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "username already exists" });
    }

    // Use nationalId as password and hash it
    const hashedPassword = await bcrypt.hash(nationalId, 10);

    const user = await usersSchema.create({
      fullName,
      username,
      password: hashedPassword, // password is hashed nationalId
      storname,
      role,
      
    });

    return res.status(201).json({
      data: user,
      message: "User created successfully",
      status: 201,
    });
  } catch (err) {
    next(err);
  }
});


// LOGIN USER
router.post("/login", async (req, res) => {
  const { employerNumber, nationalId } = req.body; // user sends both

  try {
    // Find user by employerNumber
    const user = await usersSchema.findOne({ employerNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare input nationalId with stored nationalId (plain text)
    if (nationalId !== user.nationalId) {
      return res.status(401).json({ message: "Invalid National ID" });
    }

    // Login successful
    return res.status(200).json({
      message: "Login successful",
      user: {
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        employerNumber: user.employerNumber,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});
export { router as usersRoutes }