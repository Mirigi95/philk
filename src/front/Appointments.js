import React, { useState, useEffect, useCallback } from "react";
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  X
} from "lucide-react";
import api from "../services/api";
import AppointmentForm from "./NewAppointment";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

 

  // 1. Fetch Appointments from API
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await api.get("/clinic/appointments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle both direct array or wrapped data structure
      const data = response.data?.clients || response.data || [];
      setAppointments(data)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch client list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);


  // 3. Filter Appointments locally
  const filteredAppointments = appointments.filter((appt) => {
    const matchesSearch =
      appt.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.clientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || appt.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3.5 h-3.5" /> Scheduled
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments Schedule</h1>
          <p className="text-sm text-gray-500">Manage facility patient bookings and consultations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAppointments}
            className="p-2 text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer"
          >
            <Plus className="w-5 h-5" /> New Appointment
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name, Client ID, or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
        >
          <option value="ALL">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center p-12 text-gray-500 text-sm">
            No appointments found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="p-4">Patient / ID</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Assigned Doctor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredAppointments.map((appt, idx) => (
                  <tr key={appt.id || appt._id || idx} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{appt.clientName || "N/A"}</div>
                      <div className="text-xs text-gray-500">ID: {appt.clientId || "N/A"}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {appt.appointmentDate
                          ? new Date(appt.appointmentDate).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "N/A"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <User className="w-4 h-4 text-gray-400" />
                        {appt.doctorName || "Unassigned"}
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(appt.status)}</td>
                    <td className="p-4 text-gray-500 max-w-xs truncate">{appt.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

  {/* Create Modal */}
{isModalOpen && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    {/* Added 'relative' so absolute positioning pins inside this container */}
    <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl relative">
      <button 
        type="button"
        onClick={() => setIsModalOpen(false)} // Fixed: uses state setter function
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10 cursor-pointer"
      >
        <X size={20} />
      </button>

      <h2 className="text-xl font-bold text-gray-900 pr-8">
        Schedule New Appointment
      </h2>

      <AppointmentForm 
        onCancel={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchAppointments(); // Call your refresh list handler here
        }}
      />
    </div>
  </div>
)}
    </div>
  );
};

export default Appointments;