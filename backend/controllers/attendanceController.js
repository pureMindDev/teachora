import asyncHandler from "express-async-handler";
import Class from "../models/Class.js";
import Attendance from "../models/Attendance.js";

const getOrCreateRecord = async (classDoc, user) => {
  let record = await Attendance.findOne({ class: classDoc._id, user: user._id });
  if (!record) {
    record = await Attendance.create({
      class: classDoc._id,
      user: user._id,
      role: user.role,
      sessions: [],
    });
  }
  return record;
};

// @desc Log that the current user joined the live room (called by frontend on LiveKit connect)
// @route POST /api/attendance/:classId/join
export const logJoin = asyncHandler(async (req, res) => {
  const klass = await Class.findOne({ classId: req.params.classId });
  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }

  const record = await getOrCreateRecord(klass, req.user);
  record.sessions.push({ joinedAt: new Date() });
  await record.save();

  res.json({ message: "Join logged" });
});

// @desc Log that the current user left the live room
// @route POST /api/attendance/:classId/leave
export const logLeave = asyncHandler(async (req, res) => {
  const klass = await Class.findOne({ classId: req.params.classId });
  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }

  const record = await Attendance.findOne({ class: klass._id, user: req.user._id });
  if (!record) return res.json({ message: "No active session" });

  const openSession = [...record.sessions].reverse().find((s) => !s.leftAt);
  if (openSession) {
    openSession.leftAt = new Date();
  }

  record.totalDurationSeconds = record.sessions.reduce((sum, s) => {
    const end = s.leftAt || new Date();
    return sum + Math.max(0, (end - s.joinedAt) / 1000);
  }, 0);

  await record.save();
  res.json({ message: "Leave logged" });
});

// @desc Increment a lightweight participation counter (camera-off-while-required, hand raised, chat message)
// @route POST /api/attendance/:classId/event
export const logEvent = asyncHandler(async (req, res) => {
  const { type } = req.body; // "cameraOffViolation" | "handRaised" | "chatMessage"
  const klass = await Class.findOne({ classId: req.params.classId });
  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }

  const record = await getOrCreateRecord(klass, req.user);

  if (type === "cameraOffViolation") record.cameraOffWhileRequiredCount += 1;
  else if (type === "handRaised") record.handRaisedCount += 1;
  else if (type === "chatMessage") record.chatMessageCount += 1;
  else {
    res.status(400);
    throw new Error("Unknown event type");
  }

  await record.save();
  res.json({ message: "Event logged" });
});

// @desc Get the post-class attendance & participation report (tutor only)
// @route GET /api/attendance/:classId/report
export const getClassReport = asyncHandler(async (req, res) => {
  const klass = await Class.findOne({ classId: req.params.classId }).populate(
    "tutor",
    "name email"
  );
  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }
  if (klass.tutor._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the class tutor can view this report");
  }

  const records = await Attendance.find({ class: klass._id })
    .populate("user", "name email avatarColor role")
    .sort({ role: 1 });

  const students = records
    .filter((r) => r.role === "student")
    .map((r) => ({
      user: r.user,
      sessions: r.sessions,
      totalDurationSeconds: Math.round(r.totalDurationSeconds),
      handRaisedCount: r.handRaisedCount,
      chatMessageCount: r.chatMessageCount,
      cameraOffWhileRequiredCount: r.cameraOffWhileRequiredCount,
      firstJoinedAt: r.sessions[0]?.joinedAt || null,
      lastLeftAt: r.sessions[r.sessions.length - 1]?.leftAt || null,
    }));

  res.json({
    class: {
      classId: klass.classId,
      title: klass.title,
      scheduledDate: klass.scheduledDate,
      durationMinutes: klass.durationMinutes,
      cameraRequired: klass.cameraRequired,
      status: klass.status,
      startedAt: klass.startedAt,
      endedAt: klass.endedAt,
    },
    students,
    totalStudents: students.length,
  });
});
