import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center text-[#3D2B1F]">
        <h1 className="text-4xl font-extrabold text-red-600 mb-4">403</h1>
        <h2 className="text-xl font-bold mb-6">You are not authorized to view this page</h2>
        <Link
          to="/login"
          className="inline-block text-[#3D2B1F] font-semibold hover:underline"
        >
          Go back to login
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
