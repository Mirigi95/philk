import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation, useOutlet } from "react-router-dom";
import {
  Users,
  Calendar,
  Plus,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Circle,
  Stethoscope,
  Pill,
  LogOut,
  Loader2,
  Shield,
  X,
  Activity,
  Clock3,
  UserPlus,
  ClipboardList,
  Settings,
  Sparkles,
  ChevronRight,
  Building2,
  LayoutDashboard,
  History,
  FlaskConical,
  Menu,
} from "lucide-react";

import AppointmentForm from "../front/NewAppointment";
import Appointments from "../front/Appointments";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutlet();

  const name =
    sessionStorage.getItem("userName") ||
    localStorage.getItem("userName") ||
    "Admin";

  const role =
    sessionStorage.getItem("role") ||
    localStorage.getItem("role") ||
    "Administrator";

  const facility =
    sessionStorage.getItem("facility") ||
    localStorage.getItem("facility") ||
    "Medical";

  const [userName, setUserName] = useState(name);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [statsData, setStatsData] = useState({
    totalPatients: 0,
    todayAppointments: 0,
  });

  const [view, setView] = useState("list");
  const [selectedClient, setSelectedClient] = useState(null);

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
    fetchDashboardData();
  };

  useEffect(() => {
    const storedName =
      sessionStorage.getItem("userName") ||
      localStorage.getItem("userName");

    if (storedName) {
      setUserName(storedName);
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [clientsRes, apptsRes] = await Promise.all([
        fetch("/api/clients", { headers }).then((res) =>
          res.ok ? res.json() : []
        ),
        fetch("/api/appointments", { headers }).then((res) =>
          res.ok ? res.json() : []
        ),
      ]);

      const clientList = Array.isArray(clientsRes)
        ? clientsRes
        : clientsRes.clients || [];

      const apptList = Array.isArray(apptsRes)
        ? apptsRes
        : apptsRes.appointments || [];

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
      const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      sessionStorage.clear();
      localStorage.clear();
      navigate("/login");
    }
  };

  const navigationItems = [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", route: "/admin", icon: LayoutDashboard },
        { label: "Appointments", route: "/admin/appointment", icon: Calendar },
      ],
    },
    {
      group: "Clinical",
      items: [
        { label: "New Consultation", route: "/admin/consult", icon: Stethoscope },
        { label: "Consultation List", route: "/admin/constlist", icon: ClipboardList },
        { label: "Treatment History", route: "/admin/history", icon: History },
        { label: "Lab Tests", route: "/admin/labtest", icon: FlaskConical },
      ],
    },
    {
      group: "Management",
      items: [
        { label: "Patients", route: "/admin/list", icon: Users },
        { label: "Doctors", route: "/admin/doctors", icon: Stethoscope },
        { label: "Prescriptions", route: "/admin/prescriptions", icon: Pill },
        { label: "Settings", route: "/admin/settings", icon: Settings },
      ],
    },
  ];

  const setupTasks = [
    {
      id: 1,
      title: "Clinic Profile & Operating Hours",
      completed: true,
      route: "/admin/settings",
    },
    {
      id: 2,
      title: "Add Staff & Doctors",
      completed: true,
      route: "/admin/staff",
    },
    {
      id: 3,
      title: "Configure Appointment Slots",
      completed: false,
      route: "/admin/schedules",
    },
    {
      id: 4,
      title: "Setup Billing & Insurance Codes",
      completed: false,
      route: "/admin/billing",
    },
  ];

  const stats = [
    {
      title: "Total Patients",
      value: statsData.totalPatients,
      description: "Registered patients",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      accent: "from-blue-500 to-cyan-500",
    },
    {
      title: "Today's Appointments",
      value: statsData.todayAppointments,
      description: "Booked sessions",
      icon: Calendar,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      accent: "from-emerald-500 to-teal-500",
    },
    {
      title: "Active Doctors",
      value: "14",
      description: "2 currently on leave",
      icon: Stethoscope,
      color: "text-violet-600",
      bg: "bg-violet-50",
      accent: "from-violet-500 to-purple-500",
    },
    {
      title: "Pending Prescriptions",
      value: "19",
      description: "Requires dispatch",
      icon: Pill,
      color: "text-amber-600",
      bg: "bg-amber-50",
      accent: "from-amber-500 to-orange-500",
    },
  ];

  const quickActions = [
    {
      title: "New Appointment",
      description: "Schedule a patient",
      icon: Calendar,
      action: () => handleOpenAppointmentForm(),
      color: "bg-blue-600",
      hover: "hover:bg-blue-700",
    },
    {
      title: "Add Patient",
      description: "Register a patient",
      icon: UserPlus,
      action: () => navigate("/admin/client"),
      color: "bg-emerald-600",
      hover: "hover:bg-emerald-700",
    },
    {
      title: "Consultation",
      description: "Open consultation",
      icon: Stethoscope,
      action: () => navigate("/admin/consult"),
      color: "bg-violet-600",
      hover: "hover:bg-violet-700",
    },
    {
      title: "View Patients",
      description: "Manage patient records",
      icon: Users,
      action: () => navigate("/admin/list"),
      color: "bg-slate-800",
      hover: "hover:bg-slate-900",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900 flex flex-col md:flex-row">
      {/* Decorative background blur */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute top-[45%] -left-40 h-96 w-96 rounded-full bg-cyan-100/30 blur-3xl" />
      </div>

      {/* SIDEBAR NAVIGATION */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out shrink-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Building2 className="text-white" size={20} />
              </div>
              <div className="leading-tight">
                <h1 className="font-bold text-slate-900 text-base truncate max-w-[130px]">
                  {facility}
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>

            <button
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <nav className="space-y-6">
            {navigationItems.map((group) => (
              <div key={group.group}>
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {group.group}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.route;

                    return (
                      <Link
                        key={item.label}
                        to={item.route}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-sm"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Icon
                          size={17}
                          className={isActive ? "text-blue-600" : "text-slate-400"}
                        />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-blue-100/70 border border-blue-200/50 flex items-center justify-center shrink-0">
                <Shield size={16} className="text-blue-600" />
              </div>
              <div className="leading-tight truncate max-w-[100px]">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400 capitalize truncate">
                  {role}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80 px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Welcome back, {userName}
              </h2>
              <p className="text-xs text-slate-500">
                Here is an overview of {facility}'s operational status today.
              </p>
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="p-4 sm:p-8 flex-1 space-y-8">
          {outlet ? (
            outlet
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.accent}`}
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">
                            {item.title}
                          </p>
                          <h3 className="text-2xl font-bold text-slate-900">
                            {loading ? (
                              <Loader2 className="animate-spin text-slate-400" size={20} />
                            ) : (
                              item.value
                            )}
                          </h3>
                        </div>
                        <div
                          className={`p-3 rounded-xl ${item.bg} ${item.color}`}
                        >
                          <Icon size={20} />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
                        <TrendingUp size={12} className="text-emerald-500" />
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions Grid */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((qa, idx) => {
                    const Icon = qa.icon;
                    return (
                      <button
                        key={idx}
                        onClick={qa.action}
                        className={`${qa.color} ${qa.hover} text-white p-4 rounded-2xl shadow-sm text-left transition-all flex items-center justify-between group`}
                      >
                        <div>
                          <p className="font-bold text-sm">{qa.title}</p>
                          <p className="text-xs text-white/80">
                            {qa.description}
                          </p>
                        </div>
                        <div className="p-2 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                          <Icon size={18} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Setup Tasks & Appointments Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Onboarding / Setup Tasks */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-500" />
                      Clinic Setup Checklist
                    </h3>
                    <span className="text-xs font-semibold text-slate-400">
                      2/4 Done
                    </span>
                  </div>

                  <div className="space-y-2">
                    {setupTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => navigate(task.route)}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {task.completed ? (
                            <CheckCircle2
                              size={18}
                              className="text-emerald-500 shrink-0"
                            />
                          ) : (
                            <Circle
                              size={18}
                              className="text-slate-300 shrink-0"
                            />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              task.completed
                                ? "line-through text-slate-400"
                                : "text-slate-700"
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Appointments */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Clock3 size={16} className="text-blue-600" />
                      Recent Appointments
                    </h3>
                    <Link
                      to="/admin/appointment"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      View All <ArrowRight size={12} />
                    </Link>
                  </div>

                  {loading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="animate-spin text-slate-400" size={24} />
                    </div>
                  ) : appointments.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">
                      No recent appointments found.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {appointments.map((appt, i) => (
                        <div
                          key={appt._id || i}
                          className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {appt.clientName?.[0] || "P"}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                {appt.clientName || "Unnamed Patient"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {appt.date || "Today"} • {appt.time || "Scheduled"}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                            {appt.status || "Confirmed"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* APPOINTMENT MODAL */}
      {view === "add-appointment" && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />

            <button
              onClick={handleCloseAppointmentForm}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors z-10"
              aria-label="Close appointment form"
            >
              <X size={18} />
            </button>

            <div className="p-1 sm:p-2">
              <AppointmentForm
                preselectedClient={selectedClient}
                onCancel={handleCloseAppointmentForm}
                onSuccess={handleAppointmentSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}