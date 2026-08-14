import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const AVATAR_COLORS = ["#4F46E5", "#F5A623", "#1FAE7A", "#E1436B", "#2B2E6B", "#0891B2"];

// @desc Register a new user (tutor or student)
// @route POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Please provide name, email, password and role");
  }

  if (!["tutor", "student"].includes(role)) {
    res.status(400);
    throw new Error("Role must be either 'tutor' or 'student'");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const user = await User.create({ name, email, password, role, avatarColor });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarColor: user.avatarColor,
    token: generateToken(user._id, user.role),
  });
});

// @desc Authenticate user & get token
// @route POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarColor: user.avatarColor,
    token: generateToken(user._id, user.role),
  });
});

// @desc Get current logged-in user
// @route GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});
