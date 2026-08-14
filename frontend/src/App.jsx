import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import TutorDashboard from "./pages/TutorDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import CreateClass from "./pages/CreateClass.jsx";
import ClassLobby from "./pages/ClassLobby.jsx";
import ClassRoom from "./pages/ClassRoom.jsx";
import ClassReport from "./pages/ClassReport.jsx";
import NotFound from "./pages/NotFound.jsx";

const Protected = ({ children, role }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (role && user.role !== role) {
    // A class link works for both roles, so only bounce to the dashboard when
    // a route is genuinely role-locked (e.g. /tutor/create).
    return <Navigate to={user.role === "tutor" ? "/tutor" : "/student"} replace />;
  }
  return children;
};

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === "tutor" ? "/tutor" : "/student"} replace />
          ) : (
            <Landing />
          )
        }
      />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route
        path="/tutor"
        element={
          <Protected role="tutor">
            <TutorDashboard />
          </Protected>
        }
      />
      <Route
        path="/tutor/create"
        element={
          <Protected role="tutor">
            <CreateClass />
          </Protected>
        }
      />
      <Route
        path="/tutor/report/:classId"
        element={
          <Protected role="tutor">
            <ClassReport />
          </Protected>
        }
      />
      <Route
        path="/student"
        element={
          <Protected role="student">
            <StudentDashboard />
          </Protected>
        }
      />

      <Route
        path="/class/:classId"
        element={
          <Protected>
            <ClassLobby />
          </Protected>
        }
      />
      <Route
        path="/class/:classId/room"
        element={
          <Protected>
            <ClassRoom />
          </Protected>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
