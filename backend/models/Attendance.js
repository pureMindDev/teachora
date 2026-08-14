import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    joinedAt: { type: Date, required: true },
    leftAt: { type: Date },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["tutor", "student"], required: true },
    sessions: [sessionSchema],
    totalDurationSeconds: { type: Number, default: 0 },
    cameraOffWhileRequiredCount: { type: Number, default: 0 },
    handRaisedCount: { type: Number, default: 0 },
    chatMessageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ class: 1, user: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
