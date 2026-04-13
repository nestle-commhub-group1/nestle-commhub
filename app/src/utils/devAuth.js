/**
 * devAuth.js — Developer authentication bypass utility.
 * Only intended for use during local development (import.meta.env.DEV === true).
 */

const devUsers = {
  retailer: {
    id: "dev-retailer-001",
    fullName: "Chamara Perera",
    email: "chamara@test.com",
    role: "retailer",
    phone: "0771234567",
    businessName: "Perera Grocery",
    businessAddress: "123 Kandy Road",
    taxId: "TAX123456"
  },
  staff: {
    id: "dev-staff-001",
    fullName: "Nadeeka Perera",
    email: "nadeeka@nestle.com",
    role: "staff",
    phone: "0777654321",
    employeeId: "NES002",
    department: "Sales & Distribution",
    officeLocation: "Colombo Head Office"
  },
  hq_admin: {
    id: "dev-admin-001",
    fullName: "Dilini Fernando",
    email: "dilini@nestle.com",
    role: "hq_admin",
    phone: "0112345678",
    employeeId: "NES001",
    department: "HQ Operations",
    officeLocation: "Colombo Head Office"
  },
  distributor: {
    id: "dev-distributor-001",
    fullName: "Kamal Jayawardena",
    email: "kamal@distributor.com",
    role: "distributor",
    phone: "0761234567",
    employeeId: "NES004",
    department: "Distribution",
    officeLocation: "Colombo Distribution Centre"
  },
  promotion_manager: {
    id: "dev-proms-001",
    fullName: "Sonia Perera",
    email: "sonia@nestle.com",
    role: "promotion_manager",
    phone: "0771122334",
    employeeId: "NES005",
    department: "Promotions",
    officeLocation: "Colombo Head Office"
  },
};

export const getRedirectPath = (role) => {
  const paths = {
    retailer: "/retailer/dashboard",
    staff: "/staff/dashboard",
    hq_admin: "/admin/dashboard",
    distributor: "/distributor/dashboard",
    promotion_manager: "/promotion-manager/dashboard",
  };
  return paths[role] || "/login";
};

export const loginAsRole = (role) => {
  const user = devUsers[role];
  if (!user) return;
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", "dev-token-" + role);
  window.location.href = getRedirectPath(role);
};

export const clearDevAuth = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "/login";
};

export { devUsers };
