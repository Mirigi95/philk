import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
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
} from "lucide-react";

import AppointmentForm from "../front/NewAppointment";
import Appointments from "../front/Appointments";

export default function AdminDashboard() {
  const navigate = useNavigate();

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
      iconBg: "bg-blue-100",
      accent: "from-blue-500 to-cyan-500",
    },
    {
      title: "Today's Appointments",
      value: statsData.todayAppointments,
      description: "Booked sessions",
      icon: Calendar,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      accent: "from-emerald-500 to-teal-500",
    },
    {
      title: "Active Doctors",
      value: "14",
      description: "2 currently on leave",
      icon: Stethoscope,
      color: "text-violet-600",
      bg: "bg-violet-50",
      iconBg: "bg-violet-100",
      accent: "from-violet-500 to-purple-500",
    },
    {
      title: "Pending Prescriptions",
      value: "19",
      description: "Requires dispatch",
      icon: Pill,
      color: "text-amber-600",
      bg: "bg-amber-50",
      iconBg: "bg-amber-100",
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
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute top-[45%] -left-40 h-96 w-96 rounded-full bg-cyan-100/30 blur-3xl" />
      </div>

      <main className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* =====================================================
            TOP BAR
        ====================================================== */}
        <div className="mb-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 className="text-white" size={24} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {facility}
                </h1>

                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  System Online
                </span>
              </div>

              <p className="text-sm text-slate-500 mt-0.5">
                Management &amp; Operations Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Shield size={17} className="text-blue-600" />
              </div>

              <div className="leading-tight">
                <p className="text-xs font-bold text-slate-800">
                  {userName}
                </p>
                <p className="text-[10px] text-slate-400 capitalize">
                  {role}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all text-sm font-medium shadow-sm"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* =====================================================
            WELCOME HERO
        ====================================================== */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0f2d5c] via-[#124b8c] to-[#087f9d] shadow-xl shadow-blue-900/10 mb-7">
          {/* Decorative circles */}
          <div className="absolute -right-20 -top-24 w-80 h-80 rounded-full border-[40px] border-white/5" />
          <div className="absolute right-32 -bottom-32 w-72 h-72 rounded-full border-[30px] border-white/5" />
          <div className="absolute right-[30%] top-8 w-3 h-3 rounded-full bg-cyan-300/40" />
          <div className="absolute right-[20%] bottom-10 w-2 h-2 rounded-full bg-white/30" />

          <div className="relative px-6 sm:px-8 lg:px-10 py-7 sm:py-9">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-blue-100 text-xs font-medium mb-4 backdrop-blur">
                <Sparkles size={13} />
                Healthcare Management Dashboard
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Welcome back, {userName}
              </h2>

              <p className="mt-2 text-sm sm:text-base text-blue-100/80 max-w-xl leading-relaxed">
                Here's what's happening across your clinic today. Manage
                patients, appointments and clinical operations from one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => handleOpenAppointmentForm()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-sm shadow-lg hover:bg-blue-50 transition-all"
                >
                  <Plus size={17} strokeWidth={2.5} />
                  New Appointment
                </button>

                <button
                  onClick={() => navigate("/admin/appointment")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white font-semibold text-sm hover:bg-white/15 transition-all backdrop-blur"
                >
                  <Calendar size={17} />
                  View Appointments
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            STATS
        ====================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
          {stats.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.accent}`}
                />

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em]">
                      {item.title}
                    </p>

                    <div className="mt-2 flex items-baseline gap-2">
                      <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                        {loading ? (
                          <Loader2
                            size={25}
                            className="animate-spin text-slate-300"
                          />
                        ) : (
                          item.value
                        )}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <TrendingUp
                        size={13}
                        className="text-emerald-500"
                      />
                      <span className="text-xs text-slate-500">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`h-12 w-12 rounded-xl ${item.bg} flex items-center justify-center`}
                  >
                    <Icon size={21} className={item.color} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}
        <section className="mb-7">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Quick Actions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Frequently used clinic operations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;

              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="group bg-white border border-slate-200/80 rounded-2xl p-4 text-left shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-10 w-10 rounded-xl ${action.color} ${action.hover} flex items-center justify-center text-white shadow-sm transition-colors`}
                    >
                      <Icon size={19} />
                    </div>

                    <ChevronRight
                      size={17}
                      className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-800">
                    {action.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1">
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* =================================================
              APPOINTMENTS
          ================================================== */}
          <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Calendar size={16} className="text-blue-600" />
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Recent Appointments
                  </h2>
                </div>

                <p className="text-xs text-slate-400 mt-1 ml-10">
                  Latest scheduled consultations
                </p>
              </div>

              <Link
                to="/admin/appointment"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View all
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="p-3 sm:p-5">
              <Appointments />
            </div>
          </section>

          {/* =================================================
              RIGHT COLUMN
          ================================================== */}
          <div className="space-y-6">
            {/* Setup Checklist */}
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-5 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Clinic Setup
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Complete your configuration
                    </p>
                  </div>

                  <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Settings size={17} className="text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {setupTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      task.completed
                        ? "bg-emerald-50/60 border-emerald-100"
                        : "bg-slate-50/70 border-slate-100 hover:bg-blue-50/50 hover:border-blue-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
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
                        className={`text-xs sm:text-sm font-medium ${
                          task.completed
                            ? "line-through text-slate-400"
                            : "text-slate-700"
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {!task.completed && (
                      <Link
                        to={task.route}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap"
                      >
                        Setup
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* System Overview */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-lg p-5 text-white">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={17} className="text-cyan-400" />
                    <h2 className="text-sm font-bold">
                      Clinic Overview
                    </h2>
                  </div>

                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/10">
                    Healthy
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock3 size={14} />
                      <span className="text-[10px] uppercase tracking-wider">
                        Status
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold">
                      Operational
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/5 border border-white/5 p-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <ClipboardList size={14} />
                      <span className="text-[10px] uppercase tracking-wider">
                        Tasks
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold">
                      {setupTasks.filter((task) => !task.completed).length}{" "}
                      remaining
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Navigation */}
            <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">
                  Management
                </h2>
              </div>

              <div className="p-3 grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Doctors",
                    icon: Stethoscope,
                    route: "/admin/doctors",
                  },
                  {
                    label: "Patients",
                    icon: Users,
                    route: "/admin/patients",
                  },
                  {
                    label: "Prescriptions",
                    icon: Pill,
                    route: "/admin/prescriptions",
                  },
                  {
                    label: "Security",
                    icon: Shield,
                    route: "/admin/settings",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      to={item.route}
                      className="group flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50 hover:border-blue-100 transition-all"
                    >
                      <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:border-blue-100">
                        <Icon
                          size={15}
                          className="text-slate-500 group-hover:text-blue-600"
                        />
                      </div>

                      <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* =====================================================
          APPOINTMENT MODAL
      ====================================================== */}
      {view === "add-appointment" && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal top accent */}
            <div className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />

            <button
              onClick={handleCloseAppointmentForm}
              className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors z-10"
              aria-label="Close appointment form"
            >
              <X size={19} />
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

      <Outlet />
    </div>
  );
}