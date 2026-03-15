import React from "react";
import { useNavigate } from "react-router-dom";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center text-[#3D2B1F]">
        <h1 className="text-3xl font-bold mb-4">Welcome to Regional Manager Dashboard</h1>
        <div className="mb-6">
          <p className="text-lg font-semibold">{user.fullName || "User Name"}</p>
          <p className="text-gray-600">{user.email || "user@example.com"}</p>
        </div>
        <div className="inline-block bg-[#3D2B1F] text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-8">
          {user.role || "Regional Manager"}
        </div>
        <button
          onClick={handleLogout}
          className="w-full bg-[#3D2B1F] text-white font-bold py-3 rounded-lg hover:bg-[#2A1D15] transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ManagerDashboard;
