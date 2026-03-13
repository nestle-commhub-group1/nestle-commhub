export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">403 — Unauthorized</h1>
        <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
      </div>
    </div>
  );
}
