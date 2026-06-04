import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import BillDetail from "./pages/VehicleMovement/VehicleMovement";

// Populate local storage automatically for immediate access
if (!localStorage.getItem("ewb_token")) {
  localStorage.setItem("ewb_token", "immediate_access_token");
}
if (!localStorage.getItem("ewb_user")) {
  localStorage.setItem("ewb_user", JSON.stringify({
    name: "Administrator",
    role: "admin",
    state: "National"
  }));
}

function ProtectedRoute({ children }) {
  // Always allow for immediate access
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default routes to Dashboard */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Keeping auth routes for fallback, but redirecting if trying to visit them */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />

        {/* Bill Detail (formerly Vehicle Movement) */}
        <Route
          path="/bill/:id"
          element={
            <ProtectedRoute>
              <BillDetail />
            </ProtectedRoute>
          }
        />

        {/* Legacy vehicle route redirect */}
        <Route
          path="/vehicle/:vehicleId"
          element={
            <ProtectedRoute>
              <BillDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;