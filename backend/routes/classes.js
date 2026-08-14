import express from "express";
import {
  createClass,
  getTutorClasses,
  getStudentClasses,
  getClassById,
  joinClass,
  startClass,
  endClass,
  updateClass,
  cancelClass,
} from "../controllers/classController.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", requireRole("tutor"), createClass);

router.get("/mine", (req, res, next) => {
  if (req.user.role === "tutor") return getTutorClasses(req, res, next);
  return getStudentClasses(req, res, next);
});

router.get("/:classId", getClassById);
router.post("/:classId/join", requireRole("student"), joinClass);
router.patch("/:classId/start", requireRole("tutor"), startClass);
router.patch("/:classId/end", requireRole("tutor"), endClass);
router.put("/:classId", requireRole("tutor"), updateClass);
router.delete("/:classId", requireRole("tutor"), cancelClass);

export default router;
