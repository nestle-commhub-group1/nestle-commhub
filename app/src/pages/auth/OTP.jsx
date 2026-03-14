import { Link } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";

export default function OTP() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Verify your account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter the one-time password sent to your device.
          </p>
        </div>
        <p className="text-center text-gray-400 text-sm py-8">OTP input — coming soon.</p>
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="text-[#3D2B1F] font-semibold hover:underline">
            Back to Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
