import React, { useState, useEffect } from "react";
import {
  Pill,
  Calendar,
  User,
  Activity,
  FileText,
  Search,
  RefreshCw,
  AlertCircle,
  FlaskConical,
  Clock,
  ChevronDown,
  ChevronUp,
  Printer,
  ShieldAlert,
} from "lucide-react";
import api from "../services/api";

const PatientTreatmentHistory = ({ selectedConsultation = null,  onBack }) => {
    const patientId = selectedConsultation.patientId;
    const clientId = selectedConsultation.id;
    console.log(selectedConsultation);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedCards, setExpandedCards] = useState({});
  

  // Fetch Treatment History for the specific patient
  const fetchTreatmentHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const targetId = patientId || clientId;

      if (!targetId) {
        setError("No patient ID provided to load history.");
        setLoading(false);
        return;
      }

      const response = await api.get(`/clinic/treatment/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const records = response.data?.records || response.data || [];
      const list = Array.isArray(records) ? records : [];

      // Sort history chronologically (newest first)
      list.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      setHistory(list);

      // Auto-expand the most recent record by default
      if (list.length > 0) {
        setExpandedCards({ [list[0].id || list[0]._id || 0]: true });
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load patient treatment history.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatmentHistory();
  }, [patientId, clientId]);

  const toggleCard = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper to safely format dates
  const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    const dateObj = dateVal?.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
    return isNaN(dateObj.getTime())
      ? "N/A"
      : dateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  // Filter logic
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      (item.diagnosisCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.diagnosisNotes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.treatment || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.prescription || []).some((p) =>
        (p.medication || "").toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (activeTab === "prescriptions") return matchesSearch && item.prescription?.length > 0;
    if (activeTab === "tests") return matchesSearch && item.tests?.length > 0;
    if (activeTab === "allergies") return matchesSearch && item.hasAllergies;

    return matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors text-xs font-semibold"
            >
              ← Back
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-blue-600" size={24} />
              Treatment History & Records
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient ID: <span className="font-mono text-slate-700 font-semibold">{patientId || clientId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTreatmentHistory}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh History"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Toolbar: Search & Category Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search medication, diagnosis, treatment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto text-xs font-medium">
          {["all", "prescriptions", "tests", "allergies"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize px-3 py-1.5 rounded-md transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-800 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* History Timeline Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <RefreshCw className="animate-spin inline-block mr-2" size={18} />
          Retrieving treatment history records...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
          No treatment records found matching criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item, index) => {
            const cardId = item.id || item._id || index;
            const isExpanded = Boolean(expandedCards[cardId]);

            return (
              <div
                key={cardId}
                className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden transition-all"
              >
                {/* Card Top Summary Bar */}
                <div
                  onClick={() => toggleCard(cardId)}
                  className="p-4 bg-slate-50/70 hover:bg-slate-50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100/60 text-blue-700">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {formatDate(item.createdAt || item.date)}
                        </span>
                        {item.diagnosisCode && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold border border-blue-100">
                            {item.diagnosisCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {item.diagnosisNotes || item.treatment || "General Evaluation"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    {/* Quick Indicator Pills */}
                    <div className="flex items-center gap-1.5">
                      {item.hasAllergies && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <ShieldAlert size={11} /> Allergy
                        </span>
                      )}
                      {item.prescription?.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                          <Pill size={11} /> {item.prescription.length} Meds
                        </span>
                      )}
                      {item.tests?.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold flex items-center gap-1">
                          <FlaskConical size={11} /> {item.tests.length} Tests
                        </span>
                      )}
                    </div>

                    <button className="text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Card Details */}
                {isExpanded && (
                  <div className="p-5 space-y-5 bg-white text-xs text-slate-700">
                    {/* Doctor Info */}
                    <div className="flex items-center justify-between text-slate-500 border-b border-slate-100 pb-3">
                      <span className="flex items-center gap-1">
                        <User size={13} /> Attending Doctor: <strong className="text-slate-700">{item.doctorEmail || "N/A"}</strong>
                      </span>
                      {item.appointmentId && (
                        <span className="font-mono">Appt ID: {item.appointmentId}</span>
                      )}
                    </div>

                    {/* Allergies Warning if present */}
                    {item.hasAllergies && item.allergiesList?.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <strong className="text-amber-900 font-bold flex items-center gap-1.5 mb-1">
                          <ShieldAlert size={14} className="text-amber-600" /> Recorded Allergies:
                        </strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.allergiesList.map((allergy, i) => (
                            <span key={i} className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-semibold text-[10px]">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vital Signs Grid */}
                    {item.vitalSigns && (
                      <div>
                        <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1">
                          <Activity size={13} className="text-emerald-600" /> Vital Signs
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block">BP</span>
                            <strong className="text-slate-800">{item.vitalSigns.bloodPressure || "—"}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Pulse</span>
                            <strong className="text-slate-800">{item.vitalSigns.pulse ? `${item.vitalSigns.pulse} bpm` : "—"}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Temp</span>
                            <strong className="text-slate-800">{item.vitalSigns.temperature ? `${item.vitalSigns.temperature}°C` : "—"}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">SpO2</span>
                            <strong className="text-slate-800">{item.vitalSigns.oxygenSaturation ? `${item.vitalSigns.oxygenSaturation}%` : "—"}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Resp Rate</span>
                            <strong className="text-slate-800">{item.vitalSigns.respiratoryRate || "—"}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Prescriptions List */}
                    {item.prescription?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1">
                          <Pill size={13} className="text-blue-600" /> Prescribed Medications
                        </h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                              <tr>
                                <th className="p-2.5">Medication</th>
                                <th className="p-2.5">Dosage / Frequency</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {item.prescription.map((rx, idx) => (
                                <tr key={idx}>
                                  <td className="p-2.5 font-medium text-slate-800">{rx.medication}</td>
                                  <td className="p-2.5 text-slate-600">{rx.frequency}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Treatment Procedures & Lab Tests */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.treatment && (
                        <div>
                          <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">
                            Treatment Procedure
                          </h4>
                          <p className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-700">
                            {item.treatment}
                          </p>
                        </div>
                      )}

                      {item.tests?.length > 0 && (
                        <div>
                          <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                            <FlaskConical size={13} className="text-purple-600" /> Requested Lab Tests
                          </h4>
                          <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                            {item.tests.map((test, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono text-[10px]">
                                {test}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes & Follow up */}
                    {(item.notes || item.followUpDate || item.followUpInterval) && (
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-slate-600 gap-2">
                        {item.notes && (
                          <p className="italic">
                            <strong>Note:</strong> {item.notes}
                          </p>
                        )}
                        {(item.followUpDate || item.followUpInterval) && (
                          <div className="flex items-center gap-1 font-semibold text-blue-800 shrink-0">
                            <Clock size={13} /> Follow-Up: {item.followUpDate || `${item.followUpInterval} days`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientTreatmentHistory;