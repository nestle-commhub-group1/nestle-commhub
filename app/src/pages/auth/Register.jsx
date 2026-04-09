/**
 * Register.jsx
 *
 * The account registration page for all user types.
 *
 * Key responsibilities:
 * - Provides a two-tab UI: "Retailer" tab and "Nestlé Staff" tab
 * - Shows different form fields depending on the selected tab
 * - Validates all fields before submitting and shows per-field error messages
 * - Posts the completed form to /api/auth/register and redirects to login on success
 */

import { useState }          from "react";
import { Link, useNavigate }  from "react-router-dom";
import axios                  from "axios";
import API_URL                from "../../config/api";
import AuthLayout             from "../../components/AuthLayout";

/* ─── Reusable field wrapper components ────────────────────────────────────── */

// Field wraps a label, the input element (passed as children), and an error message
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

// Standard text input with consistent styling — red border on validation error
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

// Password input with a built-in show/hide toggle button
function PasswordInput({ name, value, onChange, error, autoComplete }) {
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

/* ─── Tab icon components ────────────────────────────────────────────────── */

function ShopIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />
    </svg>
  );
}

function OfficeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M8 11h1m2 0h1m-4 4h1m2 0h1m-4 4h1m2 0h1" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17H3V7a1 1 0 011-1h10v11M9 17h6m0 0h3l2-4V11h-5V7M15 17a2 2 0 104 0 2 2 0 00-4 0zM5 17a2 2 0 104 0 2 2 0 00-4 0z" />
    </svg>
  );
}

/* ─── Sri Lanka Province / District data ─────────────────────────────────── */

const SL_PROVINCES = {
  "Western Province":       ["Colombo", "Gampaha", "Kalutara"],
  "Central Province":       ["Kandy", "Matale", "Nuwara Eliya"],
  "Southern Province":      ["Galle", "Matara", "Hambantota"],
  "Northern Province":      ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  "Eastern Province":       ["Batticaloa", "Ampara", "Trincomalee"],
  "North Western Province": ["Kurunegala", "Puttalam"],
  "North Central Province": ["Anuradhapura", "Polonnaruwa"],
  "Uva Province":           ["Badulla", "Monaragala"],
  "Sabaragamuwa Province":  ["Ratnapura", "Kegalle"],
};

/* ─── Staff Category options ─────────────────────────────────────────────── */

const STAFF_CATEGORIES = [
  "Stockout Staff",
  "Product Quality Staff",
  "Logistics Staff",
  "Pricing Staff",
  "General Support",
];

/* ─── Default form state for each tab ────────────────────────────────────── */

// Separate state objects so switching tabs doesn't mix up field values
const retailerDefaults = {
  fullName: "", email: "", password: "", confirmPassword: "",
  phone: "", businessName: "", businessAddress: "", taxId: "",
  province: "", district: "",
  role: "retailer"
};

const employeeDefaults = {
  fullName: "", email: "", password: "", confirmPassword: "",
  phone: "", employeeId: "", officeLocation: "",
  staffCategory: "",
  role: "staff"
};

const distributorDefaults = {
  fullName: "", email: "", password: "", confirmPassword: "",
  phone: "", businessName: "", businessAddress: "", assignedRegion: "", role: "distributor"
};

/* ─── Tab configuration ──────────────────────────────────────────────────── */

// Two tabs: "Retailer" for external business partners, "Nestlé Staff" for employees.
// The staff tab allows selecting staff, hq_admin, or distributor as the exact role.
const TABS = [
  { id: "retailer",  label: "Retailer",      sub: "Business partner", Icon: ShopIcon },
  { id: "employee",  label: "Nestlé Staff",  sub: "Employee",          Icon: OfficeIcon },
];

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function Register() {
  const navigate = useNavigate();

  // Which tab is currently selected ("retailer" or "employee")
  const [tab, setTab] = useState("retailer");

  // Each tab has its own independent form state so switching tabs doesn't lose data
  const [retailerForm,   setRetailer]   = useState(retailerDefaults);
  const [employeeForm,   setEmployee]   = useState(employeeDefaults);
  const [distributorForm, setDistributor] = useState(distributorDefaults);

  const [errors,      setErrors]      = useState({});
  const [globalError, setGlobalError] = useState("");
  const [successMsg,  setSuccessMsg]  = useState("");

  // Map tab ID to its [form state, setState] pair — makes it easy to read/write the active form
  const formMap = {
    retailer: [retailerForm, setRetailer],
    employee: [employeeForm, setEmployee],
  };
  const [form, setForm] = formMap[tab];

  // Update only the changed field within the current tab's form object
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  /* ── Form validation ──────────────────────────────────────────────────── */

  function validate() {
    console.log("=== STARTING VALIDATION ===");

    const e = {};
    // Reusable helper: checks if a required field is empty and records the error
    const req = (field, label) => {
      if (!form[field]?.trim()) {
        e[field] = `${label} is required.`;
        console.log(`❌ Validation Failed: ${field} (${label}) is missing or empty`);
      } else {
        console.log(`✅ Validation Passed: ${field} = "${form[field]}"`);
      }
    };

    req("fullName", "Full Name");

    // Email gets extra format checking beyond just "is it empty"
    if (!form.email?.trim()) {
      e.email = "Email is required.";
      console.log(`❌ Validation Failed: email is missing or empty`);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address.";
      console.log(`❌ Validation Failed: email format invalid`);
    } else {
      console.log(`✅ Validation Passed: email = "${form.email}"`);
    }

    if (!form.password) {
      e.password = "Password is required.";
      console.log(`❌ Validation Failed: password is missing or empty`);
    } else if (form.password.length < 8) {
      e.password = "Password must be at least 8 characters.";
      console.log(`❌ Validation Failed: password is too short`);
    } else {
      console.log(`✅ Validation Passed: password = [HIDDEN]`);
    }

    if (!form.confirmPassword) {
      e.confirmPassword = "Please confirm your password.";
      console.log(`❌ Validation Failed: confirmPassword is missing or empty`);
    } else if (form.confirmPassword !== form.password) {
      e.confirmPassword = "Passwords do not match.";
      console.log(`❌ Validation Failed: confirmPassword does not match password`);
    } else {
      console.log(`✅ Validation Passed: confirmPassword matches`);
    }

    req("phone", "Phone Number");

    // Additional fields required depending on which tab is selected
    if (tab === "retailer") {
      req("businessName",    "Business Name");
      req("businessAddress", "Business Address");
      req("taxId",           "Tax ID / Business Registration Number");
      req("province",        "Province");
      req("district",        "District");
    } else if (tab === "employee") {
      // Employee ID is verified server-side against the ValidEmployee seed list
      req("employeeId",  "Employee ID");
      // Sales staff must also specify their specialisation category
      if (form.role === "staff") {
        req("staffCategory", "Staff Category");
      }
    } else if (tab === "distributor") {
      req("businessName",   "Business Name");
      req("businessAddress","Business Address");
      req("assignedRegion", "Assigned Region");
    }

    // The role field is always set by the tab/dropdown, but check anyway as a safety net
    if (!form.role) {
      e.role = "Role is required.";
      console.log(`❌ Validation Failed: role is missing or empty`);
    } else {
      console.log(`✅ Validation Passed: role = "${form.role}"`);
    }

    console.log("=== END VALIDATION ===");
    return e;
  }

  /* ── Form submission ─────────────────────────────────────────────────── */

  async function handleSubmit(e) {
    e.preventDefault();
    setGlobalError("");
    setSuccessMsg("");

    console.log("=========================================");
    console.log("FORM SUBMISSION TRIGGERED");
    console.log("Current Tab:", tab);
    console.log("Entire Form State Object right before validation:");
    console.log(JSON.parse(JSON.stringify(form)));

    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      console.log("Validation Errors:", validation);
      console.log("Submission stopped due to validation errors.");
      console.log("=========================================");
      return;
    }

    try {
      // Note: using 5001 because macOS AirPlay occupies port 5000
      console.log("Sending POST payload to backend:", form);
      const response = await axios.post(`${API_URL}/api/auth/register`, form);
      console.log("Registration Success:", response.data);
      setSuccessMsg("Account created successfully");

      // Wait 1.5 seconds so the user can see the success message before being redirected
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      console.error("Registration Error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setGlobalError(err.response.data.message);
      } else {
        setGlobalError("An error occurred during registration. Please check if the server is running.");
      }
    }
    console.log("=========================================");
  }

  // Clear all errors and messages when the user switches tabs
  function switchTab(next) { setTab(next); setErrors({}); setGlobalError(""); setSuccessMsg(""); }

  // Tailwind class for two-column layout rows
  const row2 = "grid grid-cols-1 md:grid-cols-2 gap-4";

  return (
    <AuthLayout>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md px-8 py-10">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Register as a Nestlé employee or Retailer partner
          </p>
        </div>

        {/* Tab selector — two buttons for the two registration types */}
        <p className="text-sm font-semibold text-[#3D2B1F] mb-3">I am a</p>
        <div className="grid grid-cols-2 gap-2 mb-7">
          {TABS.map(({ id, label, sub, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={`rounded-xl border-2 py-4 px-2 text-center transition-all
                ${tab === id
                  ? "border-[#3D2B1F] bg-[#F5F0EC]"    // Active tab — highlighted
                  : "border-gray-200 bg-white hover:bg-gray-50" // Inactive tab
                }`}
            >
              <Icon />
              <p className="text-xs font-bold text-[#3D2B1F] leading-tight">{label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
            </button>
          ))}
        </div>

        {/* Form — the fields shown depend on which tab is active */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Global error from the server (e.g., "Employee ID already used") */}
          {globalError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
              {globalError}
            </div>
          )}

          {/* Success message — shown briefly before redirecting to /login */}
          {successMsg && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm text-center border border-green-200">
              {successMsg}
            </div>
          )}

          {/* Common fields — shown for both tabs */}
          <div className={row2}>
            <Field label="Full Name" required error={errors.fullName}>
              <TextInput name="fullName" placeholder="John Doe" value={form.fullName} onChange={handleChange} error={errors.fullName} autoComplete="name" />
            </Field>
            <Field label="Email" required error={errors.email}>
              <TextInput name="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
            </Field>
          </div>

          <div className={row2}>
            <Field label="Password" required error={errors.password}>
              <PasswordInput name="password" value={form.password} onChange={handleChange} error={errors.password} autoComplete="new-password" />
            </Field>
            <Field label="Confirm Password" required error={errors.confirmPassword}>
              <PasswordInput name="confirmPassword" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} autoComplete="new-password" />
            </Field>
          </div>

          <Field label="Phone Number" required error={errors.phone}>
            <TextInput name="phone" type="tel" placeholder="+94 77 000 0000" value={form.phone} onChange={handleChange} error={errors.phone} autoComplete="tel" />
          </Field>

          {/* ── Retailer-only fields ────────────────────────────────────────── */}
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

              {/* Province + District — Sprint 2: replaces old single location field */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Province" required error={errors.province}>
                  <select
                    name="province"
                    value={form.province}
                    onChange={(e) => {
                      handleChange(e);
                      // Reset district when province changes
                      setForm((prev) => ({ ...prev, province: e.target.value, district: "" }));
                      if (errors.province) setErrors((prev) => ({ ...prev, province: undefined }));
                    }}
                    className={`w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-gray-800 outline-none border transition-colors ${
                      errors.province ? "border-red-400 focus:border-red-500" : "border-transparent focus:border-[#3D2B1F]"
                    }`}
                  >
                    <option value="">Select province...</option>
                    {Object.keys(SL_PROVINCES).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>

                <Field label="District" required error={errors.district}>
                  <select
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    disabled={!form.province}
                    className={`w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-gray-800 outline-none border transition-colors ${
                      errors.district ? "border-red-400 focus:border-red-500" : "border-transparent focus:border-[#3D2B1F]"
                    } ${!form.province ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">Select district...</option>
                    {(SL_PROVINCES[form.province] || []).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          )}

          {/* ── Employee-only fields ────────────────────────────────────────── */}
          {/* The role dropdown lets employees select their exact role.           */}
          {/* The selected role is sent to the backend where the employee ID      */}
          {/* is verified to match that role in the ValidEmployee collection.     */}
          {tab === "employee" && (
            <>
              <Field label="Employee Role" required error={errors.role}>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={`w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-gray-800 outline-none border transition-colors ${errors.role ? "border-red-400 focus:border-red-500" : "border-transparent focus:border-[#3D2B1F]"}`}
                >
                  <option value="staff">Staff</option>
                  <option value="hq_admin">HQ Admin</option>
                  <option value="distributor">Distributor</option>
                </select>
              </Field>

              {/* Staff Category — only shown when role is Sales Staff */}
              {form.role === "staff" && (
                <Field label="Staff Category" required error={errors.staffCategory}>
                  <select
                    name="staffCategory"
                    value={form.staffCategory}
                    onChange={handleChange}
                    className={`w-full bg-[#F5F5F5] rounded-lg px-4 py-3 text-sm text-gray-800 outline-none border transition-colors ${
                      errors.staffCategory ? "border-red-400 focus:border-red-500" : "border-transparent focus:border-[#3D2B1F]"
                    }`}
                  >
                    <option value="">Select specialisation...</option>
                    {STAFF_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </Field>
              )}

              <div className={row2}>
                <Field label="Employee ID" required error={errors.employeeId}>
                  {/* Employee ID must exist in backend ValidEmployee collection */}
                  <TextInput name="employeeId" placeholder="NES123456" value={form.employeeId} onChange={handleChange} error={errors.employeeId} />
                </Field>
              </div>
              <Field label="Office Location" error={errors.officeLocation}>
                <TextInput name="officeLocation" placeholder="Colombo Office" value={form.officeLocation} onChange={handleChange} error={errors.officeLocation} />
              </Field>
            </>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-[#3D2B1F] text-white text-sm font-semibold rounded-lg py-3.5 mt-2 hover:bg-[#2e1f15] active:scale-[0.98] transition-all"
          >
            Create Account
          </button>
        </form>

        {/* Link back to login for users who already have an account */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-[#3D2B1F] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
