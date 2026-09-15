import React, { useState, useEffect, useCallback } from "react";
import {
  Stethoscope,
  Pill,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Activity,
  RefreshCw,
  X,
} from "lucide-react";
import api from "../services/api";
import TreatmentForm from "./Treatment";
import PatientTreatmentHistory from "./PatientHistory";

const ConsultationsList = ({ onSelectPrescription, onCreateNew }) => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State for Treatment Form & History
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);

  // Fetch Consultations from Backend
  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await api.get("/clinic/consultation", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data?.records || response.data || [];
      setConsultations(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An error occurred while fetching records.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // Modal Handlers
  const handleOpenTreatmentModal = (consultation) => {
    setSelectedConsultation(consultation);
    setIsTreatmentModalOpen(true);
  };

  const handleOpenHistoryModal = (consultation) => {
    setSelectedConsultation(consultation);
    setIsHistoryModalOpen(true);
  };

  const handleCloseTreatmentModal = () => {
    setIsTreatmentModalOpen(false);
    setSelectedConsultation(null);
  };

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedConsultation(null);
  };

  // Callback after saving treatment or history entries
  const handleTreatmentSuccess = () => {
    handleCloseTreatmentModal();
    fetchConsultations(); // Refetch saved updates
  };

  const handleHistorySuccess = () => {
    handleCloseHistoryModal();
    fetchConsultations(); // Refetch saved updates
  };

  const handlePrescribeClick = (consultation) => {
    if (onSelectPrescription) {
      onSelectPrescription(consultation);
    } else {
      handleOpenHistoryModal(consultation);
    }
  };

  // Filter consultations based on search term and status
  const filteredConsultations = consultations.filter((item) => {
    const patientName = item.patientName || item.patient?.name || "";
    const apptId = item.appointmentId || item.id || "";
    const diagCode = item.diagnosisCode || item.diagnosis || "";
    const complaint = item.chiefComplaint || "";

    const matchesSearch =
      patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apptId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.toLowerCase().includes(searchTerm.toLowerCase());

    const hasPlan = Boolean(item.plan || item.treatmentPlan || item.prescriptions?.length);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && !hasPlan) ||
      (statusFilter === "completed" && hasPlan);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="text-blue-600" size={24} />
            Patient Consultations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage clinical evaluations, treatments, and prescriptions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchConsultations}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh List"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Stethoscope size={15} /> New Consultation
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search patient, ID, diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-md transition-all ${statusFilter === "all"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            All ({consultations.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-md transition-all ${statusFilter === "pending"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Pending Plan
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-md transition-all ${statusFilter === "completed"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
              }`}
          >
            Completed
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Appt / Patient</th>
              <th className="px-4 py-3">Chief Complaint</th>
              <th className="px-4 py-3">Diagnosis</th>
              <th className="px-4 py-3">Tests</th>
              <th className="px-4 py-3">Vitals</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <RefreshCw className="animate-spin inline-block mr-2" size={18} />
                  Loading consultations...
                </td>
              </tr>
            ) : filteredConsultations.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No consultation records found.
                </td>
              </tr>
            ) : (
              filteredConsultations.map((item) => {
                const hasPlan = Boolean(item.plan || item.treatmentPlan || item.prescriptions?.length);

                return (
                  <tr key={item.id || item.appointmentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        {item.patientName || item.patient?.name || "Unknown Patient"}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        ID: {item.appointmentId || item.id || "N/A"}
                      </div>
                    </td>

                    <td className="px-4 py-3 max-w-xs truncate" title={item.chiefComplaint}>
                      <span className="font-medium text-slate-800">{item.chiefComplaint || "—"}</span>
                      {item.associatedSymptoms && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          Sx: {item.associatedSymptoms}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {item.diagnosisCode || item.diagnosis ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100">
                          {item.diagnosisCode || item.diagnosis}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {Array.isArray(item.tests) && item.tests.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.tests.map((test, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-100 capitalize"
                            >
                              {test}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.vitalSigns ? (
                        <div className="space-y-0.5 text-[11px] text-slate-600">
                          <div>BP: {item.vitalSigns.bloodPressure || "—"}</div>
                          <div>HR: {item.vitalSigns.pulse ? `${item.vitalSigns.pulse} bpm` : "—"}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {hasPlan ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                          <CheckCircle2 size={12} /> Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200">
                          <Clock size={12} /> Pending Plan
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenTreatmentModal(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] flex items-center gap-1 transition-colors border border-blue-200"
                          title="Edit / Add Treatment Plan"
                        >
                          <FileText size={13} />
                          Treatment
                        </button>

                        <button
                          onClick={() => handlePrescribeClick(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
                          title="Issue Prescription / View History"
                        >
                          <Pill size={13} />
                          Prescribe
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Treatment Form Modal */}
      {isTreatmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="sticky top-0 right-0 z-10 flex justify-end p-4 bg-white/80 backdrop-blur-xs rounded-t-2xl border-b border-slate-100">
              <button
                onClick={handleCloseTreatmentModal}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                title="Close Modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 md:p-6 pt-0">
              <TreatmentForm
                selectedConsultation={selectedConsultation}
                onSuccess={handleTreatmentSuccess}
                onCancel={handleCloseTreatmentModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Patient Treatment History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto my-auto">
            <div className="sticky top-0 right-0 z-10 flex justify-end p-4 bg-white/80 backdrop-blur-xs rounded-t-2xl border-b border-slate-100">
              <button
                onClick={handleCloseHistoryModal}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                title="Close Modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 md:p-6 pt-0">
              <PatientTreatmentHistory
                selectedConsultation={selectedConsultation}
                onSuccess={handleHistorySuccess}
                onCancel={handleCloseHistoryModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationsList;