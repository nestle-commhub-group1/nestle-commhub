/**
 * AuthLayout
 * Shared wrapper for all auth pages.
 * Renders the Nestlé logo above the white card with a branded strip.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F0EDEA] flex flex-col items-center justify-center px-4 py-10">

      {/* Logo block — sits above the card, outside it */}
      <div className="flex flex-col items-center mb-6">
        <div className="bg-white rounded-2xl shadow-sm px-8 py-5 flex flex-col items-center border border-[#e8ddd7]">
          <img
            src="/nestle-logo.png"
            alt="Nestlé"
            className="h-16 w-auto object-contain"
            draggable="false"
          />
          <p className="text-xs tracking-[0.18em] uppercase text-[#3D2B1F] font-semibold mt-2 opacity-70">
            CommHub
          </p>
        </div>
      </div>

      {/* Page card */}
      {children}
    </div>
  );
}
