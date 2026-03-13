import { useState } from "react";
import { Link } from "react-router-dom";

// ── Reusable field components ─────────────────────────────────────────────────

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#3D2B1F] mb-1.5">
        {label}{" "}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function TextInput({ name, placeholder, value, onChange, error, type = "text", autoComplete }) {
  return (
    <input
      name={name}
      type={type}
      autoComplete={autoComplete}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none border transition-colors
        ${error ? "border-red-400 focus:border-red-500" : "border-transparent focus:border-[#3D2B1F]"}`}
    />
  );
}

function PasswordInput({ name, placeholder, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder="••••••••"
        value={value}
        onChange={onChange}
        className={`w-full bg-[#F5F5F5] rounded-lg px-4 py-3 pr-11 text-sm text-gray-800 placeholder-gray-400 outline-none border transition-colors
          ${error ? "border-red-400 focus:border-red-500" : "border-transparent focus:border-[#3D2B1F]"}`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-[#3D2B1F] transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Tab icons ─────────────────────────────────────────────────────────────────

function ShopIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
    </svg>
  );
}

function OfficeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 11h1m2 0h1m-4 4h1m2 0h1m-4 4h1m2 0h1" />
    </svg>
  );
}

// ── Default form state ────────────────────────────────────────────────────────

const retailerDefaults = {
  fullName: "", email: "", password: "", confirmPassword: "",
  phone: "", businessName: "", businessAddress: "", taxId: "",
};

const employeeDefaults = {
  fullName: "", email: "", password: "", confirmPassword: "",
  phone: "", employeeId: "", department: "", officeLocation: "",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function Register() {
  const [tab, setTab] = useState("retailer"); // "retailer" | "employee"
  const [retailerForm, setRetailerForm] = useState(retailerDefaults);
  const [employeeForm, setEmployeeForm] = useState(employeeDefaults);
  const [errors, setErrors] = useState({});

  const form = tab === "retailer" ? retailerForm : employeeForm;
  const setForm = tab === "retailer" ? setRetailerForm : setEmployeeForm;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate() {
    const e = {};
    const required = (field, label) => {
      if (!form[field]?.trim()) e[field] = `${label} is required.`;
    };

    required("fullName", "Full Name");

    if (!form.email?.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address.";
    }

    if (!form.password) {
      e.password = "Password is required.";
    } else if (form.password.length < 8) {
      e.password = "Password must be at least 8 characters.";
    }

    if (!form.confirmPassword) {
      e.confirmPassword = "Please confirm your password.";
    } else if (form.confirmPassword !== form.password) {
      e.confirmPassword = "Passwords do not match.";
    }

    required("phone", "Phone Number");

    if (tab === "retailer") {
      required("businessName", "Business Name");
      required("businessAddress", "Business Address");
      required("taxId", "Tax ID / Business Registration Number");
    } else {
      required("employeeId", "Employee ID");
      required("department", "Department");
      // officeLocation is optional
    }

    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    console.log(`Register [${tab}]:`, form);
    // TODO: connect to POST /api/auth/register
  }

  function switchTab(next) {
    setTab(next);
    setErrors({});
  }

  // Helper: two-column grid on md+
  const row2 = "grid grid-cols-1 md:grid-cols-2 gap-4";

  return (
    <div className="min-h-screen bg-[#F0EDEA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md px-8 py-10">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Register as a Nestlé employee or Retailer partner
          </p>
        </div>

        {/* Tab selector */}
        <p className="text-sm font-semibold text-[#3D2B1F] mb-3">I am a</p>
        <div className="grid grid-cols-2 gap-3 mb-7">
          {/* Retailer tab */}
          <button
            type="button"
            onClick={() => switchTab("retailer")}
            className={`rounded-xl border-2 py-4 px-3 text-center transition-all
              ${tab === "retailer"
                ? "border-[#3D2B1F] bg-[#F5F0EC]"
                : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
          >
            <ShopIcon />
            <p className="text-sm font-bold text-[#3D2B1F]">Retailer</p>
            <p className="text-xs text-gray-500 mt-0.5">Business partner</p>
          </button>

          {/* Employee tab */}
          <button
            type="button"
            onClick={() => switchTab("employee")}
            className={`rounded-xl border-2 py-4 px-3 text-center transition-all
              ${tab === "employee"
                ? "border-[#3D2B1F] bg-[#F5F0EC]"
                : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
          >
            <OfficeIcon />
            <p className="text-sm font-bold text-[#3D2B1F]">Nestlé</p>
            <p className="text-xs text-gray-500 mt-0.5">Employee</p>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Row: Full Name + Email */}
          <div className={row2}>
            <Field label="Full Name" required error={errors.fullName}>
              <TextInput name="fullName" placeholder="John Doe" value={form.fullName} onChange={handleChange} error={errors.fullName} autoComplete="name" />
            </Field>
            <Field label="Email" required error={errors.email}>
              <TextInput name="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
            </Field>
          </div>

          {/* Row: Password + Confirm Password */}
          <div className={row2}>
            <Field label="Password" required error={errors.password}>
              <PasswordInput name="password" value={form.password} onChange={handleChange} error={errors.password} autoComplete="new-password" />
            </Field>
            <Field label="Confirm Password" required error={errors.confirmPassword}>
              <PasswordInput name="confirmPassword" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} autoComplete="new-password" />
            </Field>
          </div>

          {/* Phone — full width */}
          <Field label="Phone Number" required error={errors.phone}>
            <TextInput name="phone" type="tel" placeholder="+94 77 000 0000" value={form.phone} onChange={handleChange} error={errors.phone} autoComplete="tel" />
          </Field>

          {/* ── Retailer-only fields ── */}
          {tab === "retailer" && (
            <>
              <Field label="Business Name" required error={errors.businessName}>
                <TextInput name="businessName" placeholder="ABC Supermarket" value={form.businessName} onChange={handleChange} error={errors.businessName} />
              </Field>
              <Field label="Business Address" required error={errors.businessAddress}>
                <TextInput name="businessAddress" placeholder="123 Main St, Colombo" value={form.businessAddress} onChange={handleChange} error={errors.businessAddress} autoComplete="street-address" />
              </Field>
              <Field label="Tax ID / Business Registration Number" required error={errors.taxId}>
                <TextInput name="taxId" placeholder="XX-XXXXXXX" value={form.taxId} onChange={handleChange} error={errors.taxId} />
              </Field>
            </>
          )}

          {/* ── Employee-only fields ── */}
          {tab === "employee" && (
            <>
              <div className={row2}>
                <Field label="Employee ID" required error={errors.employeeId}>
                  <TextInput name="employeeId" placeholder="NES123456" value={form.employeeId} onChange={handleChange} error={errors.employeeId} />
                </Field>
                <Field label="Department" required error={errors.department}>
                  <TextInput name="department" placeholder="Sales &amp; Marketing" value={form.department} onChange={handleChange} error={errors.department} />
                </Field>
              </div>
              <Field label="Office Location" error={errors.officeLocation}>
                <TextInput name="officeLocation" placeholder="Colombo Office" value={form.officeLocation} onChange={handleChange} error={errors.officeLocation} />
              </Field>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#3D2B1F] text-white text-sm font-semibold rounded-lg py-3.5 mt-2 hover:bg-[#2e1f15] active:scale-[0.98] transition-all"
          >
            Create Account
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-[#3D2B1F] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
