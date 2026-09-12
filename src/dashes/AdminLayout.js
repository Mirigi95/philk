import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Shared Header / Navigation Bar */}
      <Outlet />
    </div>
  );
}