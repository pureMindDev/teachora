import asyncHandler from "express-async-handler";
import Class from "../models/Class.js";
import Attendance from "../models/Attendance.js";

// @desc Create a scheduled class (tutor only)
// @route POST /api/classes
export const createClass = asyncHandler(async (req, res) => {
  const { title, description, scheduledDate, durationMinutes, cameraRequired } = req.body;

  if (!title || !scheduledDate) {
    res.status(400);
    throw new Error("Title and scheduled date are required");
  }

  const newClass = await Class.create({
    title,
    description,
    scheduledDate,
    durationMinutes: durationMinutes || 60,
    cameraRequired: !!cameraRequired,
    tutor: req.user._id,
  });

  res.status(201).json(newClass);
});

// @desc Get all classes created by the logged-in tutor
// @route GET /api/classes/mine (tutor)
export const getTutorClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find({ tutor: req.user._id }).sort({ scheduledDate: -1 });
  res.json(classes);
});

// @desc Get classes a student has joined (upcoming + past)
// @route GET /api/classes/mine (student)
export const getStudentClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find({ authorizedStudents: req.user._id })
    .populate("tutor", "name email avatarColor")
    .sort({ scheduledDate: -1 });
  res.json(classes);
});

// @desc Get public-safe info for a class by classId (used to preview a shared link)
// @route GET /api/classes/:classId
export const getClassById = asyncHandler(async (req, res) => {
  const klass = await Class.findOne({ classId: req.params.classId }).populate(
    "tutor",
    "name email avatarColor"
  );

  if (!klass) {
    res.status(404);
    throw new Error("Class not found. Check the link and try again.");
  }

  const isTutor = klass.tutor._id.toString() === req.user._id.toString();
  const isAuthorizedStudent = klass.authorizedStudents.some(
    (id) => id.toString() === req.user._id.toString()
  );

  res.json({
    classId: klass.classId,
    title: klass.title,
    description: klass.description,
    tutor: klass.tutor,
    scheduledDate: klass.scheduledDate,
    durationMinutes: klass.durationMinutes,
    cameraRequired: klass.cameraRequired,
    status: klass.status,
    startedAt: klass.startedAt,
    isTutor,
    isAuthorizedStudent,
  });
});

// @desc Student joins/authorizes themselves onto a class via the shared link
// @route POST /api/classes/:classId/join
export const joinClass = asyncHandler(async (req, res) => {
  const klass = await Class.findOne({ classId: req.params.classId });

  if (!klass) {
    res.status(404);
    throw new Error("Class not found. Check the link and try again.");
  }

  if (req.user.role !== "student") {
    res.status(403);
    throw new Error("Only students can join a class this way");
  }

  if (klass.status === "cancelled") {
    res.status(400);
    throw new Error("This class has been cancelled");
  }

  const alreadyAuthorized = klass.authorizedStudents.some(
    (id) => id.toString() === req.user._id.toString()
  );

  if (!alreadyAuthorized) {
    klass.authorizedStudents.push(req.user._id);
    await klass.save();
  }

  res.json({ message: "Joined class successfully", classId: klass.classId, status: klass.status });
});

// @desc Start a class (tutor only)
// @route PATCH /api/classes/:classId/start
export const startClass = asyncHandler(async (req, res) => {
  const klass = await Class.findOne({ classId: req.params.classId });

  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }
  if (klass.tutor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the class tutor can start this class");
  }
  if (klass.status === "live") {
    return res.json(klass);
  }

  klass.status = "live";
  klass.startedAt = new Date();
  await klass.save();

  res.json(klass);
});

// @desc End a class (tutor only) - finalizes attendance records
// @route PATCH /api/classes/:classId/end
export const endClass = asyncHandler(async (req, res) => {
  const klass = await Class.findOne({ classId: req.params.classId });

  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }
  if (klass.tutor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the class tutor can end this class");
  }

  klass.status = "ended";
  klass.endedAt = new Date();
  await klass.save();

  // Close out any still-open attendance sessions
  const openAttendance = await Attendance.find({ class: klass._id });
  const now = new Date();
  for (const record of openAttendance) {
    let changed = false;
    for (const session of record.sessions) {
      if (!session.leftAt) {
        session.leftAt = now;
        changed = true;
      }
    }
    if (changed) {
      record.totalDurationSeconds = record.sessions.reduce((sum, s) => {
        const end = s.leftAt || now;
        return sum + Math.max(0, (end - s.joinedAt) / 1000);
      }, 0);
      await record.save();
    }
  }

  res.json(klass);
});

// @desc Update a scheduled class (tutor only, only while not live/ended)
// @route PUT /api/classes/:classId
export const updateClass = asyncHandler(async (req, res) => {
  const klass = await Class.findOne({ classId: req.params.classId });

  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }
  if (klass.tutor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the class tutor can edit this class");
  }
  if (klass.status !== "scheduled") {
    res.status(400);
    throw new Error("Only scheduled classes can be edited");
  }

  const { title, description, scheduledDate, durationMinutes, cameraRequired } = req.body;
  if (title !== undefined) klass.title = title;
  if (description !== undefined) klass.description = description;
  if (scheduledDate !== undefined) klass.scheduledDate = scheduledDate;
  if (durationMinutes !== undefined) klass.durationMinutes = durationMinutes;
  if (cameraRequired !== undefined) klass.cameraRequired = !!cameraRequired;

  await klass.save();
  res.json(klass);
});

// @desc Cancel a scheduled class (tutor only)
// @route DELETE /api/classes/:classId
export const cancelClass = asyncHandler(async (req, res) => {
  const klass = await Class.findOne({ classId: req.params.classId });

  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }
  if (klass.tutor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the class tutor can cancel this class");
  }

  klass.status = "cancelled";
  await klass.save();
  res.json({ message: "Class cancelled" });
});
