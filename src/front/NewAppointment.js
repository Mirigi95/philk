import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Stethoscope, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2,
  Phone,
  ShieldAlert
} from "lucide-react";
import api from "../services/api";

const AppointmentForm = ({ preselectedClient, onCancel, onSuccess }) => {
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form Fields State
  const [formData, setFormData] = useState({
    clientId: preselectedClient?.clientId || "",
    clientName: preselectedClient?.fullName || "",
    appointmentDate: "",
    doctorName: "",
    notes: "",
    status: "Scheduled"
  });

  // Fetch client list if no client was passed into the form
  useEffect(() => {
    if (!preselectedClient) {
      const loadClients = async () => {
        setLoadingClients(true);
        try {
          const response = await api.get("/clinic/clients");
          const data = response.data?.clients || response.data || [];
          setClients(data);
        } catch (err) {
          setError("Failed to load patient list for selection.");
        } finally {
          setLoadingClients(false);
        }
      };
      loadClients();
    }
  }, [preselectedClient]);

  // Sync client name when selecting a client from dropdown
  const handleClientSelect = (e) => {
    const selectedId = e.target.value;
    const client = clients.find((c) => c.clientId === selectedId);

    setFormData((prev) => ({
      ...prev,
      clientId: selectedId,
      clientName: client ? client.fullName : ""
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    if (!formData.clientId || !formData.appointmentDate) {
      setError("Please fill in all required fields marked with *");
      setSubmitting(false);
      return;
    }

    try {
      const response = await api.post("/clinic/appointments", formData);

      if (response.status === 200 || response.status === 201) {
        setSuccessMsg("Appointment scheduled successfully!");
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to schedule appointment. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Bar */}
    

      {/* Alert Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <ShieldAlert size={18} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        {/* Patient Selection Banner / Dropdown */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Patient / Client *
          </label>
          {preselectedClient ? (
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {preselectedClient.fullName?.[0] || "P"}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{preselectedClient.fullName}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-blue-600">ID: {preselectedClient.clientId}</span>
                    {preselectedClient.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {preselectedClient.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                Selected
              </span>
            </div>
          ) : (
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleClientSelect}
                required
                disabled={loadingClients}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              >
                <option value="">-- Choose a patient --</option>
                {clients.map((client) => (
                  <option key={client._id || client.clientId} value={client.clientId}>
                    {client.fullName} (ID: {client.clientId})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Date & Time Picker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Appointment Date & Time *
            </label>
            <div className="relative">
              <Clock size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="datetime-local"
                name="appointmentDate"
                value={formData.appointmentDate}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Attending Practitioner */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Assigned Doctor / Clinician
            </label>
            <div className="relative">
              <Stethoscope size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                name="doctorName"
                placeholder="e.g. Dr. Jane Smith"
                value={formData.doctorName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Appointment Status Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Initial Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Notes / Symptoms / Reason */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileText size={14} className="text-slate-400" />
            Clinical Notes / Consultation Purpose
          </label>
          <textarea
            name="notes"
            rows="4"
            placeholder="Describe the reason for visit, symptoms, or special instructions..."
            value={formData.notes}
            onChange={handleChange}
            className="w-full p-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl text-sm shadow-sm transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Save Appointment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;