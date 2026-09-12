import React, { useState, useEffect } from "react";
import { useNavigate, Link, Outlet } from "react-router-dom";
import { 
  Users, 
  Calendar, 
  Plus, 
  ArrowRight, 
  TrendingUp, 
  Sparkles,
  CheckCircle2,
  Circle,
  Building2,
  Stethoscope,
  Pill,
  CreditCard,
  LogOut,
  Loader2,
  Shield,
  X
} from "lucide-react";
import AppointmentForm from "../front/NewAppointment";
import Appointments from "../front/Appointments";

export default function AdminDashboard() {
  const navigate = useNavigate();
 const name = sessionStorage.getItem("UserName");
 const role = sessionStorage.getItem("role");
  
  // Local state
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    todayAppointments: 0,
  });
  
  // Local Form View States
  const [view, setView] = useState("list"); // 'list' | 'add-appointment'
  const [selectedClient, setSelectedClient] = useState(null);

  // Trigger Form Handler
  const handleOpenAppointmentForm = (client = null) => {
    setSelectedClient(client);
    setView("add-appointment");
  };

  const handleCloseAppointmentForm = () => {
    setSelectedClient(null);
    setView("list");
  };

  const handleAppointmentSuccess = () => {
    handleCloseAppointmentForm();
    fetchDashboardData(); // Refresh metrics and appointments
  };

  useEffect(() => {
    const storedName = sessionStorage.getItem("userName") || localStorage.getItem("userName");
    if (storedName) setUserName(storedName);

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [clientsRes, apptsRes] = await Promise.all([
        fetch("/api/clients", { headers }).then((res) => (res.ok ? res.json() : [])),
        fetch("/api/appointments", { headers }).then((res) => (res.ok ? res.json() : []))
      ]);

      const clientList = Array.isArray(clientsRes) ? clientsRes : clientsRes.clients || [];
      const apptList = Array.isArray(apptsRes) ? apptsRes : apptsRes.appointments || [];

      setAppointments(apptList.slice(0, 5));
      setStatsData({
        totalPatients: clientList.length || 0,
        todayAppointments: apptList.length || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      sessionStorage.clear();
      localStorage.clear();
      navigate("/login");
    }
  };

  const setupTasks = [
    { id: 1, title: "Clinic Profile & Operating Hours", completed: true, route: "/admin/settings" },
    { id: 2, title: "Add Staff & Doctors", completed: true, route: "/admin/staff" },
    { id: 3, title: "Configure Appointment Slots", completed: false, route: "/admin/schedules" },
    { id: 4, title: "Setup Billing & Insurance Codes", completed: false, route: "/admin/billing" },
  ];

  const stats = [
    { 
      title: "Total Patients", 
      value: statsData.totalPatients, 
      change: "Registered in system", 
      icon: Users, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      title: "Today's Appointments", 
      value: statsData.todayAppointments, 
      change: "Total booked sessions", 
      icon: Calendar, 
      color: "text-emerald-600", 
      bg: "bg-emerald-50" 
    },
    { 
      title: "Active Doctors", 
      value: "14", 
      change: "2 on leave today", 
      icon: Stethoscope, 
      color: "text-purple-600", 
      bg: "bg-purple-50" 
    },
    { 
      title: "Pending Prescriptions", 
      value: "19", 
      change: "Requires dispatch", 
      icon: Pill, 
      color: "text-amber-600", 
      bg: "bg-amber-50" 
    },
  ];

  const roadmapModules = [
    {
      title: "Electronic Health Records (EHR)",
      status: "In Progress",
      description: "Patient medical history, diagnosis logs, lab results, and digital prescriptions.",
      icon: FileTextIcon,
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
    <div className="min-h-screen bg-slate-50 p-6 space-y-8 relative">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {role} {name || "Admin"} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            PhilCare Clinic System Management Portal
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Direct view toggle instead of page navigation */}
          <button 
            onClick={() => handleOpenAppointmentForm()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm transition-all text-sm cursor-pointer"
          >
            <Plus size={18} /> New Appointment
          </button>
           <button 
            onClick={() => navigate("/admin/appointment")}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-lg transition-all text-sm cursor-pointer"
          >
            <Users size={18} /> Appointments
          </button>
          
          <button 
            onClick={() => navigate("/admin/client")}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-lg transition-all text-sm cursor-pointer"
          >
            <Users size={18} /> Add Patient
          </button>
          
          <button 
            onClick={() => navigate("/admin/list")}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2.5 rounded-lg transition-all text-sm cursor-pointer"
          >
            <Users size={18} /> All Patients
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-medium px-4 py-2.5 rounded-lg transition-all text-sm cursor-pointer"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Dynamic Overlay Modal for Appointment Form */}
      {view === "add-appointment" && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative">
            <button 
              onClick={handleCloseAppointmentForm}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>
            <div className="p-2">
              <AppointmentForm
                preselectedClient={selectedClient}
                onCancel={handleCloseAppointmentForm}
                onSuccess={handleAppointmentSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dynamic System Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                  {loading ? <Loader2 size={20} className="animate-spin text-slate-400 mt-1" /> : item.value}
                </h3>
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
        {/* Main Left Column */}
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
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
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

          {/* Appointments Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Recent Appointments</h2>
              <Link to="/admin/appointments" className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>

           <Appointments />
          </div>

        </div>

        {/* Right Column */}
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
                    ) }
                    <span className={`text-xs font-medium ${task.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                      {task.title}
                    </span>
                  </div>
                  {!task.completed && (
                    <Link to={task.route} className="text-xs font-semibold text-blue-600 hover:underline">
                      Setup
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Navigation</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/doctors" className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <Stethoscope size={20} className="mx-auto text-slate-600 group-hover:text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">Doctors</span>
              </Link>
              <Link to="/admin/patients" className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <Users size={20} className="mx-auto text-slate-600 group-hover:text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">Patients</span>
              </Link>
              <Link to="/admin/prescriptions" className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <Pill size={20} className="mx-auto text-slate-600 group-hover:text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">Prescriptions</span>
              </Link>
              <Link to="/admin/settings" className="p-3 rounded-xl border border-slate-100 bg-slate-50 text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
                <Shield size={20} className="mx-auto text-slate-600 group-hover:text-blue-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">Security</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
      <Outlet />
    </div>
  );
}

function FileTextIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}