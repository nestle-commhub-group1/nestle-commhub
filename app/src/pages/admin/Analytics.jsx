import React from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import InsightsDashboard from './InsightsDashboard';
import PMInsightsDashboard from '../pm/PMInsightsDashboard';
import StockManagerInsightsDashboard from '../stock_manager/StockManagerInsightsDashboard';
import RetailerInsightsDashboard from '../retailer/RetailerInsightsDashboard';

/* ─── Role → dashboard mapping ────────────────────────────────────────────── */

const DASHBOARD_BY_ROLE = {
  hq_admin:          InsightsDashboard,
  staff:             InsightsDashboard,
  promotion_manager: PMInsightsDashboard,
  stock_manager:     StockManagerInsightsDashboard,
  retailer:          RetailerInsightsDashboard,
};

const Analytics = () => {
  const { user } = useAuth();
  const role = user?.role || '';

  // Pick the right dashboard — fall back to InsightsDashboard for unknown roles
  const DashboardComponent = DASHBOARD_BY_ROLE[role] || InsightsDashboard;

  // hq_admin and staff get the AdminLayout wrapper + the dashboard;
  // other roles render their dashboard directly (it brings its own layout)
  const needsAdminLayout = role === 'hq_admin' || role === 'staff';

  if (needsAdminLayout) {
    return (
      <AdminLayout>
        <DashboardComponent />
      </AdminLayout>
    );
  }

  // PM, Stock Manager, Retailer dashboards embed their own layout
  return <DashboardComponent />;
};

export default Analytics;
