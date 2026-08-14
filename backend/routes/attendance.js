import express from "express";
import {
  logJoin,
  logLeave,
  logEvent,
  getClassReport,
} from "../controllers/attendanceController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/:classId/join", logJoin);
router.post("/:classId/leave", logLeave);
router.post("/:classId/event", logEvent);
router.get("/:classId/report", requireRole("tutor"), getClassReport);

export default router;
