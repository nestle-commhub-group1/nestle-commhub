import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// Auth pages
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import OTP from "./pages/auth/OTP";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Retailer pages
import RetailerDashboard from "./pages/retailer/RetailerDashboard";

// Staff pages
import StaffDashboard from "./pages/staff/StaffDashboard";

// Manager pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Distributor pages
import DistributorDashboard from "./pages/distributor/DistributorDashboard";

// Misc
import Unauthorized from "./pages/auth/Unauthorized";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Retailer routes */}
          <Route
            path="/retailer/*"
            element={
              <ProtectedRoute roles="retailer">
                <RetailerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Sales Staff routes */}
          <Route
            path="/staff/*"
            element={
              <ProtectedRoute roles="sales_staff">
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* Regional Manager routes */}
          <Route
            path="/manager/*"
            element={
              <ProtectedRoute roles="regional_manager">
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* HQ Admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles="hq_admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Distributor routes */}
          <Route
            path="/distributor/*"
            element={
              <ProtectedRoute roles="distributor">
                <DistributorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
