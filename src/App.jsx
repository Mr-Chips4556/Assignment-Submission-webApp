import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ClassPageEnhanced from "./pages/ClassPageEnhanced";

// ── Protected route wrapper ──────────────────────────────────────────
function PrivateRoute({ children, allowedRole }) {
  const { currentUser, role } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
  }
  return children;
}

// ── Root redirect based on role ──────────────────────────────────────
function RootRedirect() {
  const { currentUser, role } = useAuth();

  console.log("RootRedirect - currentUser:", currentUser);
  console.log("RootRedirect - role:", role);

  if (!currentUser) {
    console.log("No user, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  const redirectPath = role === "teacher" ? "/teacher" : "/student";
  console.log("User found, redirecting to:", redirectPath);
  return <Navigate to={redirectPath} replace />;
}

// ── App ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root route - explicit redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student routes */}
          <Route
            path="/student"
            element={
              <PrivateRoute allowedRole="student">
                <StudentDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/student/class/:classId"
            element={
              <PrivateRoute allowedRole="student">
                <ClassPageEnhanced />
              </PrivateRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher"
            element={
              <PrivateRoute allowedRole="teacher">
                <TeacherDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/class/:classId"
            element={
              <PrivateRoute allowedRole="teacher">
                <ClassPageEnhanced />
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
