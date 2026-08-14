import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.js";
import classRoutes from "./routes/classes.js";
import livekitRoutes from "./routes/livekit.js";
import attendanceRoutes from "./routes/attendance.js";

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "teachora-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/livekit", livekitRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Teachora API running on port ${PORT}`));
