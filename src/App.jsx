import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import VehicleMovement from "./pages/VehicleMovement/VehicleMovement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Register Page */}
        <Route path="/register" element={<Register />} />

        {/* Main Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Vehicle Movement */}
        <Route path="/vehicle-movement/:vehicleId" element={<VehicleMovement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;