import mongoose from "mongoose";
import { nanoid } from "nanoid";

const classSchema = new mongoose.Schema(
  {
    classId: { type: String, unique: true, default: () => nanoid(10) },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    scheduledDate: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, default: 60 },
    cameraRequired: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended", "cancelled"],
      default: "scheduled",
    },
    startedAt: { type: Date },
    endedAt: { type: Date },
    // Students explicitly authorized to join (added by tutor or via approved link join)
    authorizedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Class", classSchema);
