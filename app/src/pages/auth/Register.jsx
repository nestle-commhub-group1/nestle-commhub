import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";

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

// ── Tab icons ─────────────────────────────────────────────────────────────────

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

// ── Default form state ────────────────────────────────────────────────────────

const retailerDefaults = {
  fullName: "", email: "", password: "", confirmPassword: "",
  phone: "", businessName: "", businessAddress: "", taxId: "",
};

const employeeDefaults = {
  fullName: "", email: "", password: "", confirmPassword: "",
  phone: "", employeeId: "", department: "", officeLocation: "",
};

const driverDefaults = {
  fullName: "", email: "", password: "", confirmPassword: "",
  phone: "", licenseNo: "", vehiclePlate: "", assignedZone: "",
};

// ── Tabs config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "retailer", label: "Retailer",     sub: "Business partner", Icon: ShopIcon },
  { id: "employee", label: "Nestlé Staff", sub: "Employee",          Icon: OfficeIcon },
  { id: "driver",   label: "Driver",       sub: "Delivery driver",   Icon: TruckIcon },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function Register() {
  const [tab, setTab]               = useState("retailer");
  const [retailerForm, setRetailer] = useState(retailerDefaults);
  const [employeeForm, setEmployee] = useState(employeeDefaults);
  const [driverForm,   setDriver]   = useState(driverDefaults);
  const [errors, setErrors]         = useState({});

  const formMap = {
    retailer: [retailerForm, setRetailer],
    employee: [employeeForm, setEmployee],
    driver:   [driverForm,   setDriver],
  };
  const [form, setForm] = formMap[tab];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate() {
    const e = {};
    const req = (field, label) => { if (!form[field]?.trim()) e[field] = `${label} is required.`; };

    req("fullName", "Full Name");

    if (!form.email?.trim())                             e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address.";

    if (!form.password)                  e.password = "Password is required.";
    else if (form.password.length < 8)   e.password = "Password must be at least 8 characters.";

    if (!form.confirmPassword)                         e.confirmPassword = "Please confirm your password.";
    else if (form.confirmPassword !== form.password)   e.confirmPassword = "Passwords do not match.";

    req("phone", "Phone Number");

    if (tab === "retailer") {
      req("businessName",    "Business Name");
      req("businessAddress", "Business Address");
      req("taxId",           "Tax ID / Business Registration Number");
    } else if (tab === "employee") {
      req("employeeId",  "Employee ID");
      req("department",  "Department");
    } else if (tab === "driver") {
      req("licenseNo",    "Driving License No.");
      req("vehiclePlate", "Vehicle Plate No.");
      req("assignedZone", "Assigned Zone / Region");
    }

    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) { setErrors(validation); return; }
    console.log(`Register [${tab}]:`, form);
    // TODO: connect to POST /api/auth/register
  }

  function switchTab(next) { setTab(next); setErrors({}); }

  const row2 = "grid grid-cols-1 md:grid-cols-2 gap-4";

  return (
    <AuthLayout>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md px-8 py-10">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#3D2B1F]">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">
            Register as a Nestlé employee, Retailer partner, or Delivery Driver
          </p>
        </div>

        {/* Tab selector — 3 columns */}
        <p className="text-sm font-semibold text-[#3D2B1F] mb-3">I am a</p>
        <div className="grid grid-cols-3 gap-2 mb-7">
          {TABS.map(({ id, label, sub, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              className={`rounded-xl border-2 py-4 px-2 text-center transition-all
                ${tab === id
                  ? "border-[#3D2B1F] bg-[#F5F0EC]"
                  : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
            >
              <Icon />
              <p className="text-xs font-bold text-[#3D2B1F] leading-tight">{label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Common: Full Name + Email */}
          <div className={row2}>
            <Field label="Full Name" required error={errors.fullName}>
              <TextInput name="fullName" placeholder="John Doe" value={form.fullName} onChange={handleChange} error={errors.fullName} autoComplete="name" />
            </Field>
            <Field label="Email" required error={errors.email}>
              <TextInput name="email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} error={errors.email} autoComplete="email" />
            </Field>
          </div>

          {/* Common: Password + Confirm Password */}
          <div className={row2}>
            <Field label="Password" required error={errors.password}>
              <PasswordInput name="password" value={form.password} onChange={handleChange} error={errors.password} autoComplete="new-password" />
            </Field>
            <Field label="Confirm Password" required error={errors.confirmPassword}>
              <PasswordInput name="confirmPassword" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} autoComplete="new-password" />
            </Field>
          </div>

          {/* Common: Phone */}
          <Field label="Phone Number" required error={errors.phone}>
            <TextInput name="phone" type="tel" placeholder="+94 77 000 0000" value={form.phone} onChange={handleChange} error={errors.phone} autoComplete="tel" />
          </Field>

          {/* ── Retailer-only ── */}
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

          {/* ── Employee-only ── */}
          {tab === "employee" && (
            <>
              <div className={row2}>
                <Field label="Employee ID" required error={errors.employeeId}>
                  <TextInput name="employeeId" placeholder="NES123456" value={form.employeeId} onChange={handleChange} error={errors.employeeId} />
                </Field>
                <Field label="Department" required error={errors.department}>
                  <TextInput name="department" placeholder="Sales & Marketing" value={form.department} onChange={handleChange} error={errors.department} />
                </Field>
              </div>
              <Field label="Office Location" error={errors.officeLocation}>
                <TextInput name="officeLocation" placeholder="Colombo Office" value={form.officeLocation} onChange={handleChange} error={errors.officeLocation} />
              </Field>
            </>
          )}

          {/* ── Driver-only ── */}
          {tab === "driver" && (
            <>
              <div className={row2}>
                <Field label="Driving License No." required error={errors.licenseNo}>
                  <TextInput name="licenseNo" placeholder="B1234567" value={form.licenseNo} onChange={handleChange} error={errors.licenseNo} />
                </Field>
                <Field label="Vehicle Plate No." required error={errors.vehiclePlate}>
                  <TextInput name="vehiclePlate" placeholder="WP CAB-1234" value={form.vehiclePlate} onChange={handleChange} error={errors.vehiclePlate} />
                </Field>
              </div>
              <Field label="Assigned Zone / Region" required error={errors.assignedZone}>
                <TextInput name="assignedZone" placeholder="e.g. Colombo North" value={form.assignedZone} onChange={handleChange} error={errors.assignedZone} />
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
    </AuthLayout>
  );
}
