import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Dashboard from "./pages/Dashboard/Dashboard";
import BillDetail from "./pages/VehicleMovement/VehicleMovement";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("ewb_user") || "null");
  } catch {
    return null;
  }
}

function isAuthenticated() {
  const token = localStorage.getItem("ewb_token");
  return Boolean(token && token !== "immediate_access_token");
}

function ProtectedRoute({ children, adminOnly = false }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly) {
    const user = getStoredUser();
    if (user?.role !== "admin") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    const user = getStoredUser();
    if (user?.role === "admin") {
      return <Navigate to="/dashboard?role=admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPassword />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <ResetPassword />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bill/:id"
          element={
            <ProtectedRoute>
              <BillDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vehicle/:vehicleId"
          element={
            <ProtectedRoute>
              <BillDetail />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
