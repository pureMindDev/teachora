import express from "express";
import { getLiveKitToken } from "../controllers/livekitController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.post("/token/:classId", getLiveKitToken);

export default router;
