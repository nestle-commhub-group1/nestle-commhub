/**
 * App.jsx
 *
 * The root component of the Nestlé CommHub frontend application.
 *
 * Key responsibilities:
 * - Wraps the entire app in AuthProvider so all pages can access auth state
 * - Defines every client-side route using React Router
 * - Enforces role-based access control via the ProtectedRoute wrapper
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// ── Auth pages (no role required — publicly accessible) ────────────────────
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import OTP from "./pages/auth/OTP";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Unauthorized from "./pages/Unauthorized";

// ── Retailer pages (role: "retailer") ─────────────────────────────────────
import RetailerDashboard from "./pages/retailer/RetailerDashboard";
import RetailerProfile from "./pages/retailer/RetailerProfile";
import SubmitIssue from "./pages/retailer/SubmitIssue";
import MyTickets from "./pages/retailer/MyTickets";
import TicketDetail from "./pages/retailer/TicketDetail";
import PromotionsWall from "./pages/retailer/PromotionsWall";
import MyPromotions from "./pages/retailer/MyPromotions";
import StockRequests from "./pages/retailer/StockRequests";
import DeliveryTracking from "./pages/retailer/DeliveryTracking";
import RetailerInsights from "./pages/retailer/RetailerInsights";
import RetailerInsightsDashboard from "./pages/retailer/RetailerInsightsDashboard";
import SmartPromotions           from "./pages/retailer/SmartPromotions";
import AvailableB2CPromotions from "./pages/retailer/AvailableB2CPromotions";

// ── Staff pages (role: "staff") ─────────────────────────────────────
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffProfile from "./pages/staff/StaffProfile";
import StaffMyTickets from "./pages/staff/MyTickets";
import StaffTicketDetail from "./pages/staff/TicketDetail";
import StaffBroadcasts from "./pages/staff/Broadcasts";

// ── Admin pages (role: "hq_admin") ────────────────────────────────────────
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProfile from "./pages/admin/AdminProfile";
import UserManagement from "./pages/admin/UserManagement";
import SLAMonitor from "./pages/admin/SLAMonitor";
import Analytics from "./pages/admin/Analytics";
import AdminBroadcasts from "./pages/admin/Broadcasts";
import DistributorEvaluations from "./pages/admin/DistributorEvaluations";
import AdminTicketDetail from "./pages/admin/AdminTicketDetail";
import InsightsDashboard from "./pages/admin/InsightsDashboard";

// ── Promotion Manager pages (role: "promotion_manager") ────────────────────
import PromotionManagerDashboard from "./pages/promotion_manager/Dashboard";
import PromotionManagerProfile from "./pages/promotion_manager/Profile";
import PMInsightsDashboard from "./pages/pm/PMInsightsDashboard";
import PromotionsDashboard from "./pages/pm/PromotionsDashboard";
import CreateB2BPromotion from "./pages/pm/CreateB2BPromotion";
import CreateB2CPromotion from "./pages/pm/CreateB2CPromotion";

// ── Distributor pages (role: "distributor") ────────────────────────────────
import DistributorDashboard from "./pages/distributor/DistributorDashboard";
import DistributorTicketDetail from "./pages/distributor/DistributorTicketDetail";
import PromotionalMaterials from "./pages/distributor/PromotionalMaterials";

// ── Stock Manager pages (role: "stock_manager") ──────────────────────────
import StockManagerDashboard from "./pages/stock_manager/StockManagerDashboard";
import InventoryManagement from "./pages/stock_manager/InventoryManagement";
import OrderManagement from "./pages/stock_manager/OrderManagement";
import StockManagerProfile from "./pages/stock_manager/Profile";
import StockManagerInsightsDashboard from "./pages/stock_manager/StockManagerInsightsDashboard";
import SmartOrdering                 from "./pages/stock_manager/SmartOrdering";

// ── Dev tools (only accessible in development mode) ────────────────────────
import DevLauncher from "./pages/DevLauncher";

function App() {
  return (
    // AuthProvider makes login state and user data available to every component
    // in the tree via the useAuth() hook
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Dev-only launcher — lets developers bypass login during testing ── */}
          {/* In production (import.meta.env.DEV === false), this redirects to /login */}
          <Route
            path="/dev"
            element={import.meta.env.DEV ? <DevLauncher /> : <Navigate to="/login" replace />}
          />

          {/* ── Public routes — anyone can access these without logging in ──────── */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ── Retailer routes — only accessible with role="retailer" ──────────── */}
          {/* ProtectedRoute checks isAuthenticated AND that user.role === "retailer" */}
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
          <Route path="/retailer/promotions" element={<ProtectedRoute roles="retailer"><PromotionsWall /></ProtectedRoute>} />
          <Route path="/retailer/my-promotions" element={<ProtectedRoute roles="retailer"><MyPromotions /></ProtectedRoute>} />
          <Route path="/retailer/stock-requests" element={<ProtectedRoute roles="retailer"><StockRequests /></ProtectedRoute>} />
          <Route path="/retailer/delivery" element={<ProtectedRoute roles="retailer"><DeliveryTracking /></ProtectedRoute>} />
          <Route path="/retailer/insights" element={<ProtectedRoute roles="retailer"><RetailerInsightsDashboard /></ProtectedRoute>} />
          <Route path="/retailer/smart-promotions" element={<ProtectedRoute roles="retailer"><SmartPromotions /></ProtectedRoute>} />
          <Route path="/retailer/available-b2c" element={<ProtectedRoute roles="retailer"><AvailableB2CPromotions /></ProtectedRoute>} />
          {/* ── Sales Staff routes — only accessible with role="staff" ─────── */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute roles="staff">
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/staff/profile" element={<ProtectedRoute roles="staff"><StaffProfile /></ProtectedRoute>} />
          <Route path="/staff/tickets" element={<ProtectedRoute roles="staff"><StaffMyTickets /></ProtectedRoute>} />
          <Route path="/staff/tickets/:id" element={<ProtectedRoute roles="staff"><StaffTicketDetail /></ProtectedRoute>} />
          <Route path="/staff/broadcasts" element={<ProtectedRoute roles="hq_admin"><StaffBroadcasts /></ProtectedRoute>} />

          {/* ── HQ Admin routes — only accessible with role="hq_admin" ──────────── */}
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
              <ProtectedRoute roles={["hq_admin", "staff"]}>
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
          <Route
            path="/admin/tickets/:id"
            element={
              <ProtectedRoute roles="hq_admin">
                <AdminTicketDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/insights"
            element={
              <ProtectedRoute roles={["hq_admin", "staff", "promotion_manager", "stock_manager"]}>
                <Analytics />
              </ProtectedRoute>
            }
          />

          {/* ── Centralized insights routes — role-gated entry points ─────────── */}
          <Route
            path="/pm/insights"
            element={
              <ProtectedRoute roles={["promotion_manager", "hq_admin", "staff"]}>
                <PMInsightsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/insights"
            element={
              <ProtectedRoute roles={["stock_manager", "hq_admin", "staff"]}>
                <StockManagerInsightsDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Promotion Manager routes ──────────── */}
          <Route
            path="/promotion-manager/dashboard"
            element={
              <ProtectedRoute roles="promotion_manager">
                <PromotionManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotion-manager/promotions"
            element={
              <ProtectedRoute roles="promotion_manager">
                <PromotionsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotion-manager/create-b2b"
            element={
              <ProtectedRoute roles="promotion_manager">
                <CreateB2BPromotion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotion-manager/create-b2c"
            element={
              <ProtectedRoute roles="promotion_manager">
                <CreateB2CPromotion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotion-manager/profile"
            element={
              <ProtectedRoute roles="promotion_manager">
                <PromotionManagerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/promotion-manager/insights"
            element={
              <ProtectedRoute roles="promotion_manager">
                <PMInsightsDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Distributor routes ──────── */}
          <Route
            path="/distributor/dashboard"
            element={
              <ProtectedRoute roles="distributor">
                <DistributorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/distributor/tickets/:id"
            element={
              <ProtectedRoute roles="distributor">
                <DistributorTicketDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/distributor/promotions"
            element={
              <ProtectedRoute roles="distributor">
                <PromotionalMaterials />
              </ProtectedRoute>
            }
          />

          {/* ── Stock Manager routes ──────── */}
          <Route
            path="/stock-manager/dashboard"
            element={
              <ProtectedRoute roles="stock_manager">
                <StockManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-manager/inventory"
            element={
              <ProtectedRoute roles="stock_manager">
                <InventoryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-manager/orders"
            element={
              <ProtectedRoute roles="stock_manager">
                <OrderManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-manager/profile"
            element={
              <ProtectedRoute roles="stock_manager">
                <StockManagerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-manager/insights"
            element={
              <ProtectedRoute roles="stock_manager">
                <StockManagerInsightsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-manager/smart-ordering"
            element={
              <ProtectedRoute roles="stock_manager">
                <SmartOrdering />
              </ProtectedRoute>
            }
          />

          {/* ── Catch-all — any unknown URL redirects to login ─────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
