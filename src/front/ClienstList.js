import React, { useState, useEffect } from "react";
import {
  User,
  Search,
  Plus,
  Calendar,
  Phone,
  MapPin,
  Activity,
  ShieldAlert,
  ChevronRight,
  Filter,
  X
} from "lucide-react";
import api from "../services/api";
import AppointmentForm from "./NewAppointment";
import { NewClient } from "../doc/NewClient";

const ClientList = ({ onAddNewClient, onAddAppointment }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [selectedClientVitals, setSelectedClientVitals] = useState(null);
  const [appointmentModal, setAppointmentModal] = useState(false);
  const [selectedClientForAppointment, setSelectedClientForAppointment] = useState(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // Fetch all clients
  const fetchClients = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await api.get("/clinic/clients", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data?.clients || response.data || [];
      setClients(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch client list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filter clients by Name, Client ID, Phone, or Nat ID
  const filteredClients = clients.filter((client) => {
    const term = searchTerm.toLowerCase();
    return (
      client.fullName?.toLowerCase().includes(term) ||
      client.clientId?.toLowerCase().includes(term) ||
      client.phone?.toLowerCase().includes(term) ||
      client.idNo?.toLowerCase().includes(term)
    );
  });

  // Open Appointment Modal
  const handleOpenAppointment = (client) => {
    if (onAddAppointment) {
      onAddAppointment(client);
    } else {
      setSelectedClientForAppointment(client);
      setAppointmentModal(true);
    }
  };

  // Open Registration Modal
  const handleOpenNewClient = () => {
    if (onAddNewClient) {
      onAddNewClient();
    } else {
      setShowNewClientModal(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User className="text-blue-600" size={26} />
            Client Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage registered patients, review initial vitals, and schedule appointments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenNewClient}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl text-sm shadow-sm transition-all"
          >
            <Plus size={18} />
            Register New Client
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Client ID, Name, Phone, or National ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm">
          <Filter size={16} className="text-slate-400" />
          <span>Total Records: <strong className="text-slate-800">{filteredClients.length}</strong></span>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <ShieldAlert size={18} />
          {error}
        </div>
      )}

      {/* Client Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <Activity className="animate-spin mx-auto text-blue-600 mb-2" size={24} />
            Loading clients directory...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <User className="mx-auto text-slate-300 mb-3" size={40} />
            <h3 className="text-slate-700 font-semibold text-base">No Clients Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm ? "No patient matches your search criteria." : "Start by registering your first client."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-4 px-6">Client Info</th>
                  <th className="py-4 px-6">Contact & Location</th>
                  <th className="py-4 px-6">Age / DOB</th>
                  <th className="py-4 px-6">Latest Vitals</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredClients.map((client) => (
                  <tr key={client._id || client.clientId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & ID */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{client.fullName}</div>
                      <div className="text-xs text-blue-600 font-mono mt-0.5">
                        ID: {client.clientId}
                      </div>
                      {client.idNo && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          Nat ID: {client.idNo}
                        </div>
                      )}
                    </td>

                    {/* Phone & Address */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs mb-1">
                        <Phone size={13} className="text-slate-400" />
                        {client.phone || "N/A"}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                        <MapPin size={13} className="text-slate-400" />
                        {client.address || "N/A"}
                      </div>
                    </td>

                    {/* Age / DOB */}
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div>{client.age ? `${client.age} yrs` : "N/A"}</div>
                      <div className="text-slate-400 mt-0.5">{client.dob || "—"}</div>
                    </td>

                    {/* Quick Vitals Summary */}
                    <td className="py-4 px-6">
                      {client.bloodPressure || client.temperature ? (
                        <button
                          onClick={() => setSelectedClientVitals(client)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors"
                        >
                          <Activity size={14} />
                          <span>BP: {client.bloodPressure || "N/A"}</span>
                          <ChevronRight size={12} />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No vitals logged</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenAppointment(client)}
                          className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors"
                          title="Schedule Appointment"
                        >
                          <Calendar size={14} />
                          Add Appointment
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1. Vitals Detail Modal */}
      {selectedClientVitals && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Activity className="text-emerald-500" size={18} />
                Initial Vitals ({selectedClientVitals.fullName})
              </h3>
              <button
                onClick={() => setSelectedClientVitals(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">Blood Pressure</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedClientVitals.bloodPressure || "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">Temperature</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedClientVitals.temperature ? `${selectedClientVitals.temperature} °C` : "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">Pulse Rate</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedClientVitals.pulse ? `${selectedClientVitals.pulse} bpm` : "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">SpO2 Oxygen</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedClientVitals.oxygenSaturation ? `${selectedClientVitals.oxygenSaturation}%` : "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">Respiratory Rate</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedClientVitals.respiratoryRate || "N/A"}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 block mb-1">Pain Score</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedClientVitals.painLevel ?? "N/A"}/10</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedClientVitals(null)}
              className="w-full py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Close Vitals
            </button>
          </div>
        </div>
      )}

      {/* 2. New Appointment Modal */}
      {appointmentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative my-8">
            <button
              onClick={() => setAppointmentModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={18} />
            </button>
            <AppointmentForm 
              client={selectedClientForAppointment} 
              onClose={() => setAppointmentModal(false)} 
            />
          </div>
        </div>
      )}

      {/* 3. Register New Client Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl relative my-8">
            <NewClient
              onCancel={() => setShowNewClientModal(false)}
              onSuccess={() => {
                setShowNewClientModal(false);
                fetchClients(); // Refresh list after adding
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientList;