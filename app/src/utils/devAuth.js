/**
 * Only intended for use during local development (import.meta.env.DEV === true).
 */
import API_URL from '../config/api';

const devUsers = {
  retailer: {
    fullName: "Silva Super Center",
    email: "retailer1@test.com",
    role: "retailer",
  },
  staff: {
    fullName: "Kasun Perera",
    email: "staff@nestle.com",
    role: "staff",
  },
  hq_admin: {
    fullName: "Dilini Fernando",
    email: "admin@nestle.com",
    role: "hq_admin",
  },
  distributor: {
    fullName: "Distributor One",
    email: "distributor1@test.com",
    role: "distributor",
  },
  promotion_manager: {
    fullName: "Mahesh Wickramasinghe",
    email: "pm@nestle.com",
    role: "promotion_manager",
  },
  stock_manager: {
    fullName: "Nadeeka Ratnayake",
    email: "sm@nestle.com",
    role: "stock_manager",
  },
};

export const getRedirectPath = (role) => {
  const paths = {
    retailer: "/retailer/dashboard",
    staff: "/staff/dashboard",
    hq_admin: "/admin/dashboard",
    distributor: "/distributor/dashboard",
    promotion_manager: "/promotion-manager/dashboard",
    stock_manager: "/stock-manager/dashboard",
  };
  return paths[role] || "/login";
};

export const loginAsRole = async (role) => {
  const user = devUsers[role];
  if (!user) return;
  
  try {
    // Perform a REAL login request to get the REAL MongoDB ID and a valid JWT
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: "password123" })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      window.location.href = getRedirectPath(role);
    } else {
      alert("Dev Login Failed: " + (data.message || "User not found. Did you run 'npm run seed'?"));
    }
  } catch (err) {
    console.error("Dev Login Error:", err);
    alert("Dev Login Error: Check if backend is running on 5001");
  }
};

export const clearDevAuth = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "/login";
};

export { devUsers };
