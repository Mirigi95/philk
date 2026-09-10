import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Activity, 
  AlertCircle, 
  Clock, 
  Shield, 
  FileText, 
  Plus, 
  ArrowRight, 
  TrendingUp, 
  Sparkles,
  CheckCircle2,
  Circle,
  Building2,
  Stethoscope,
  Pill,
  CreditCard
} from "lucide-react";

const AdminDashboard = () => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedName = sessionStorage.getItem("userName");
    if (storedName) setUserName(storedName);
  }, []);

  // System Setup Checklist
  const setupTasks = [
    { id: 1, title: "Clinic Profile & Operating Hours", completed: true, route: "/admin/settings" },
    { id: 2, title: "Add Staff & Doctors", completed: true, route: "/admin/staff" },
    { id: 3, title: "Configure Appointment Slots", completed: false, route: "/admin/schedules" },
    { id: 4, title: "Setup Billing & Insurance Codes", completed: false, route: "/admin/billing" },
  ];

  // System Metrics
  const stats = [
    { title: "Total Patients", value: "1,248", change: "+12% this month", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Today's Appointments", value: "32", change: "8 pending confirmation", icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Active Doctors", value: "14", change: "2 on leave today", icon: Stethoscope, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "Pending Prescriptions", value: "19", change: "Requires dispatch", icon: Pill, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  // Next Modules Roadmap (Guides Future Development)
  const roadmapModules = [
    {
      title: "Electronic Health Records (EHR)",
      status: "In Progress",
      description: "Patient medical history, diagnosis logs, lab results, and digital prescriptions.",
      icon: FileText,
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      title: "Pharmacy & Inventory",
      status: "Planned",
      description: "Track medicine stock, automated low-stock alerts, and prescription fulfillment.",
      icon: Pill,
      badgeColor: "bg-amber-100 text-amber-700",
    },
    {
      title: "Billing & Claims",
      status: "Planned",
      description: "Patient invoicing, PhilHealth / Insurance claims processing, and payment receipts.",
      icon: CreditCard,
      badgeColor: "bg-purple-100 text-purple-700",
    },
    {
      title: "Multi-Clinic Management",
      status: "Up Next",
      description: "Manage multiple clinic branches, cross-branch doctor schedules, and central analytics.",
      icon: Building2,
      badgeColor: "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {userName || "Admin"} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            PhilCare Clinic System Management Portal
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = "/admin/appointments/new"}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm"
          >
            <Plus size={18} /> New Appointment
          </button>
          <button 
            onClick={() => window.location.href = "/admin/patients/add"}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-lg transition-all text-sm"
          >
            <Users size={18} /> Add Patient
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{item.value}</h3>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <TrendingUp size={12} className="text-emerald-500" />
                  {item.change}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${item.bg}`}>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Module Development Roadmap */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-blue-600" size={20} />
                <h2 className="text-lg font-bold text-slate-800">System Modules & Roadmap</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Build Guidance</span>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Features currently active and upcoming core modules recommended for your next development sprint.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roadmapModules.map((module, i) => {
                const ModIcon = module.icon;
                return (
                  <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                        <ModIcon size={18} className="text-slate-700" />
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${module.badgeColor}`}>
                        {module.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mt-2">{module.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{module.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Activity Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Today's Appointments</h2>
              <a href="/admin/appointments" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Maria Santos</td>
                    <td className="p-3">Dr. Reyes (General)</td>
                    <td className="p-3">09:00 AM</td>
                    <td className="p-3"><span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium">Completed</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Juan Dela Cruz</td>
                    <td className="p-3">Dr. Garcia (Pediatrics)</td>
                    <td className="p-3">10:30 AM</td>
                    <td className="p-3"><span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">In Progress</span></td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-800">Elena Gomez</td>
                    <td className="p-3">Dr. Reyes (General)</td>
                    <td className="p-3">02:00 PM</td>
                    <td className="p-3"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">Scheduled</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (1 Col wide) */}
        <div className="space-y-8">
          
          {/* Setup Onboarding Guidance */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Clinic Setup Checklist</h2>
            <p className="text-xs text-slate-500 mb-4">Complete these setup steps to make the system fully functional.</p>

            <div className="space-y-3">
              {setupTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Circle size={18} className="text-slate-300 shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${task.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                      {task.title}
                    </span>
                  </div>
                  {!task.completed && (
                    <a href={task.route} className="text-xs font-semibold text-blue-600 hover:underline">
                      Setup
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Navigation</h2>
            <div className="grid grid-cols-2 gap-3">
              <a href="/admin/doctors" className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <Stethoscope size={20} className="mx-auto text-slate-600 group-hover:text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">Doctors</span>
              </a>
              <a href="/admin/patients" className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <Users size={20} className="mx-auto text-slate-600 group-hover:text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">Patients</span>
              </a>
              <a href="/admin/prescriptions" className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <Pill size={20} className="mx-auto text-slate-600 group-hover:text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">Prescriptions</span>
              </a>
              <a href="/admin/settings" className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <Shield size={20} className="mx-auto text-slate-600 group-hover:text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">Security</span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;