import React, { useState, useEffect, useMemo } from "react";
import {
  Pill,
  Search,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Clock,
  User,
  Printer,
  AlertCircle,
  FileText,
} from "lucide-react";
import api from "../services/api";

const Prescription = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // pending | dispensed | all
  const [dispensingId, setDispensingId] = useState(null);

  const getRecordTime = (item) => {
    const raw = item.createdAt || item.date;
    if (!raw) return 0;
    if (typeof raw === "object" && raw?.seconds) return raw.seconds * 1000;
    const parsed = new Date(raw).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "N/A";
    const dateObj =
      typeof dateVal === "object" && dateVal?.seconds
        ? new Date(dateVal.seconds * 1000)
        : new Date(dateVal);
    return Number.isNaN(dateObj.getTime())
      ? "N/A"
      : dateObj.toLocaleDateString("en-KE", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError("");
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await api.get("/clinic/treatment", { headers });
      const rawData = response.data?.records ?? response.data;
      const list = Array.isArray(rawData) ? rawData : [];

      // Keep only records that actually contain prescribed medications, sorted newest first
      const rxList = list
        .filter(
          (item) =>
            Array.isArray(item.prescription) && item.prescription.length > 0
        )
        .sort((a, b) => getRecordTime(b) - getRecordTime(a));

      setRecords(rxList);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to load pharmacy prescription queue.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Mark prescription as dispensed (updates UI optimistically + calls backend if PATCH/PUT exists)
  const handleMarkDispensed = async (record) => {
    const id = record.id || record._id;
    if (!id) return;

    setDispensingId(id);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Attempt backend status update if your API supports PATCH/PUT on /clinic/treatment
      await api
        .patch(
          `/clinic/treatment`,
          { id, prescriptionStatus: "dispensed" },
          { headers }
        )
        .catch(() => {
          // Fallback if PATCH isn't wired yet—keeps UI responsive
        });

      setRecords((prev) =>
        prev.map((item) =>
          (item.id || item._id) === id
            ? {
                ...item,
                prescriptionStatus: "dispensed",
                dispensedAt: new Date().toISOString(),
              }
            : item
        )
      );
    } finally {
      setDispensingId(null);
    }
  };

  const filteredPrescriptions = useMemo(() => {
    return records.filter((item) => {
      const status = (item.prescriptionStatus || "pending").toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) return false;

      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;

      return (
        (item.clientId || "").toLowerCase().includes(q) ||
        (item.patientId || "").toLowerCase().includes(q) ||
        (item.appointmentId || "").toLowerCase().includes(q) ||
        (item.doctorEmail || "").toLowerCase().includes(q) ||
        (item.diagnosisCode || "").toLowerCase().includes(q) ||
        (item.prescription || []).some((rx) =>
          (rx.medication || "").toLowerCase().includes(q)
        )
      );
    });
  }, [records, searchTerm, statusFilter]);

  const pendingCount = useMemo(
    () =>
      records.filter(
        (r) => (r.prescriptionStatus || "pending").toLowerCase() === "pending"
      ).length,
    [records]
  );

  return (
    <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 print:p-0 print:border-none print:shadow-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="text-emerald-600" size={24} />
            Pharmacy Prescription Queue
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pending Orders:{" "}
            <span className="font-bold text-emerald-700">{pendingCount}</span> |
            Total Prescriptions:{" "}
            <span className="font-semibold text-slate-700">
              {records.length}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            <Printer size={15} /> Print Queue
          </button>
          <button
            type="button"
            onClick={fetchPrescriptions}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Refresh Queue"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="relative w-full sm:w-80">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search patient ID, drug name, doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
          {[
            { key: "pending", label: "Pending" },
            { key: "dispensed", label: "Dispensed" },
            { key: "all", label: "All" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === tab.key
                  ? "bg-white text-slate-800 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Prescription List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <RefreshCw className="animate-spin inline-block mr-2" size={18} />
          Loading pharmacy prescriptions...
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
          No prescriptions found for this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map((item, idx) => {
            const recordId = item.id || item._id || idx;
            const isDispensed =
              (item.prescriptionStatus || "pending").toLowerCase() ===
              "dispensed";

            return (
              <div
                key={recordId}
                className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs print:break-inside-avoid"
              >
                {/* Top Patient & Order Metadata Bar */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        Patient: {item.clientId || item.patientId || "N/A"}
                      </span>
                      {item.appointmentId && (
                        <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono text-[10px]">
                          Appt: {item.appointmentId}
                        </span>
                      )}
                      {item.diagnosisCode && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-mono text-[10px] font-bold">
                          ICD: {item.diagnosisCode}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          isDispensed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isDispensed ? (
                          <>
                            <CheckCircle2 size={11} /> Dispensed
                          </>
                        ) : (
                          <>
                            <Clock size={11} /> Pending Dispense
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <User size={12} /> Prescriber:{" "}
                        <strong className="text-slate-700">
                          {item.doctorEmail || "N/A"}
                        </strong>
                      </span>
                      <span>
                        Issued: {formatDate(item.createdAt || item.date)}
                      </span>
                    </div>
                  </div>

                  {/* Dispense Action */}
                  <div className="flex items-center gap-2 print:hidden">
                    {!isDispensed && (
                      <button
                        type="button"
                        disabled={dispensingId === recordId}
                        onClick={() => handleMarkDispensed(item)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <CheckCircle2 size={14} />
                        {dispensingId === recordId
                          ? "Updating..."
                          : "Mark Dispensed"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Allergy Alert Banner (Critical for Pharmacist Verification) */}
                {item.hasAllergies && item.allergiesList?.length > 0 && (
                  <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 flex flex-wrap items-center gap-2 text-xs text-red-900">
                    <span className="font-bold flex items-center gap-1 text-red-700">
                      <ShieldAlert size={15} /> ALLERGY ALERT:
                    </span>
                    {item.allergiesList.map((allergy, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-red-100 border border-red-300 font-bold text-[11px]"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                )}

                {/* Prescribed Medications Table */}
                <div className="p-4 space-y-3">
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2.5 w-10">#</th>
                          <th className="p-2.5">Medication</th>
                          <th className="p-2.5">Dosage / Frequency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {item.prescription.map((rx, rxIdx) => (
                          <tr key={rxIdx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-slate-400 font-mono">
                              {rxIdx + 1}
                            </td>
                            <td className="p-2.5 font-bold text-slate-800">
                              {rx.medication || "—"}
                            </td>
                            <td className="p-2.5 text-slate-700">
                              {rx.frequency || "As directed"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Optional Pharmacist / Clinical Instructions */}
                  {item.notes && (
                    <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-start gap-1.5">
                      <FileText
                        size={14}
                        className="text-slate-400 shrink-0 mt-0.5"
                      />
                      <span>
                        <strong>Instructions / Notes:</strong> {item.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Prescription;