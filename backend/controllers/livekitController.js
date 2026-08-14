import asyncHandler from "express-async-handler";
import { AccessToken } from "livekit-server-sdk";
import Class from "../models/Class.js";

// @desc Issue a LiveKit room access token for a class
//       Room name == classId. Only the tutor or an authorized student may get a token.
// @route POST /api/livekit/token/:classId
export const getLiveKitToken = asyncHandler(async (req, res) => {
  const klass = await Class.findOne({ classId: req.params.classId });

  if (!klass) {
    res.status(404);
    throw new Error("Class not found");
  }

  if (klass.status !== "live") {
    res.status(400);
    throw new Error("This class is not currently live");
  }

  const isTutor = klass.tutor.toString() === req.user._id.toString();
  const isAuthorizedStudent = klass.authorizedStudents.some(
    (id) => id.toString() === req.user._id.toString()
  );

  if (!isTutor && !isAuthorizedStudent) {
    res.status(403);
    throw new Error("You are not authorized to join this class");
  }

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
    // Distinct, non-throwing response so the frontend can drop into a local
    // dev-preview mode instead of a dead-end error page. This keeps the rest
    // of the app (dashboards, scheduling, links, lobby) testable before real
    // LiveKit credentials are wired up.
    return res.status(200).json({
      configured: false,
      isTutor,
      cameraRequired: klass.cameraRequired,
    });
  }

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: req.user._id.toString(),
    name: req.user.name,
    metadata: JSON.stringify({
      role: req.user.role,
      avatarColor: req.user.avatarColor,
    }),
  });

  at.addGrant({
    room: klass.classId,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    // Only the tutor can start with room-admin style permissions like muting others
    roomAdmin: isTutor,
  });

  const token = await at.toJwt();

  res.json({
    configured: true,
    token,
    url: process.env.LIVEKIT_URL,
    isTutor,
    cameraRequired: klass.cameraRequired,
  });
});
