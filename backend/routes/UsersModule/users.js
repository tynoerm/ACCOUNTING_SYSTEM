import express from "express";
import bcrypt from "bcrypt";
import usersSchema from "../../models/UsersModule/users.js";

const router = express.Router();

// REGISTER USER
router.post("/create-user", async (req, res, next) => {
  try {
    const {
      fullName, // ✅ matches frontend now
      username,
      storename,
      role,
      password,
    } = req.body;

    if (!fullName || !username || !storename || !role || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await usersSchema.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await usersSchema.create({
      fullName,
      username,
      password: hashedPassword,
      storename,
      role,
    });

    return res.status(201).json({
      message: "User created successfully",
      data: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        storename: user.storename,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await usersSchema.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Successful login
    res.status(200).json({
      message: "Login successful",
      user: {
        username: user.username,
        role: user.role,
        storename: user.storename,
      },
    });
  } catch (err) {
    next(err);
  }
});

export { router as usersRoutes };
