import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// Auth pages
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import OTP from "./pages/auth/OTP";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Unauthorized from "./pages/Unauthorized";

// Retailer pages
import RetailerDashboard from "./pages/retailer/RetailerDashboard";
import RetailerProfile from "./pages/retailer/RetailerProfile";
import SubmitIssue from "./pages/retailer/SubmitIssue";
import MyTickets from "./pages/retailer/MyTickets";
import TicketDetail from "./pages/retailer/TicketDetail";
import Promotions from "./pages/retailer/Promotions";
import StockRequests from "./pages/retailer/StockRequests";
import DeliveryTracking from "./pages/retailer/DeliveryTracking";

// Staff pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffProfile from "./pages/staff/StaffProfile";
import StaffMyTickets from "./pages/staff/MyTickets";
import StaffTicketDetail from "./pages/staff/TicketDetail";
import RetailerDirectory from "./pages/staff/RetailerDirectory";
import StaffBroadcasts from "./pages/staff/Broadcasts";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import UserManagement from "./pages/admin/UserManagement";
import SLAMonitor from "./pages/admin/SLAMonitor";
import Analytics from "./pages/admin/Analytics";
import AdminBroadcasts from "./pages/admin/Broadcasts";
import DistributorEvaluations from "./pages/admin/DistributorEvaluations";

// Distributor pages
import DistributorDashboard from "./pages/distributor/DistributorDashboard";

// Dev tools (only used in development)
import DevLauncher from "./pages/DevLauncher";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Dev launcher — only accessible in development mode */}
          <Route
            path="/dev"
            element={import.meta.env.DEV ? <DevLauncher /> : <Navigate to="/login" replace />}
          />

          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Retailer routes */}
          <Route
            path="/retailer/dashboard"
            element={
              <ProtectedRoute roles="retailer">
                <RetailerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/retailer/profile" element={<ProtectedRoute roles="retailer"><RetailerProfile /></ProtectedRoute>} />
          <Route path="/retailer/submit-issue" element={<ProtectedRoute roles="retailer"><SubmitIssue /></ProtectedRoute>} />
          <Route path="/retailer/tickets" element={<ProtectedRoute roles="retailer"><MyTickets /></ProtectedRoute>} />
          <Route path="/retailer/tickets/:id" element={<ProtectedRoute roles="retailer"><TicketDetail /></ProtectedRoute>} />
          <Route path="/retailer/promotions" element={<ProtectedRoute roles="retailer"><Promotions /></ProtectedRoute>} />
          <Route path="/retailer/stock-requests" element={<ProtectedRoute roles="retailer"><StockRequests /></ProtectedRoute>} />
          <Route path="/retailer/delivery" element={<ProtectedRoute roles="retailer"><DeliveryTracking /></ProtectedRoute>} />

          {/* Sales Staff routes */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute roles="sales_staff">
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/staff/profile" element={<ProtectedRoute roles="sales_staff"><StaffProfile /></ProtectedRoute>} />
          <Route path="/staff/tickets" element={<ProtectedRoute roles="sales_staff"><StaffMyTickets /></ProtectedRoute>} />
          <Route path="/staff/tickets/:id" element={<ProtectedRoute roles="sales_staff"><StaffTicketDetail /></ProtectedRoute>} />
          <Route path="/staff/directory" element={<ProtectedRoute roles="sales_staff"><RetailerDirectory /></ProtectedRoute>} />
          <Route path="/staff/broadcasts" element={<ProtectedRoute roles="sales_staff"><StaffBroadcasts /></ProtectedRoute>} />

          {/* HQ Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles="hq_admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute roles="hq_admin">
                <AdminProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles="hq_admin">
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sla"
            element={
              <ProtectedRoute roles="hq_admin">
                <SLAMonitor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute roles="hq_admin">
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/broadcasts"
            element={
              <ProtectedRoute roles="hq_admin">
                <AdminBroadcasts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/evaluations"
            element={
              <ProtectedRoute roles="hq_admin">
                <DistributorEvaluations />
              </ProtectedRoute>
            }
          />

          {/* Distributor routes */}
          <Route
            path="/distributor/dashboard"
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
