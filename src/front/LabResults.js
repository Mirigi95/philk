import React, { useState, useEffect, useMemo } from "react";
import {
  FlaskConical,
  Search,
  RefreshCw,
  AlertCircle,
  User,
  Calendar,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../services/api";

const toSafeText = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean"
  ) {
    return String(val);
  }
  if (typeof val === "object") {
    if (typeof val.message === "string") return val.message;
    if (typeof val.error === "string") return val.error;
    try {
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const flagBadgeClass = (flag) => {
  switch (String(flag || "normal").toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-300";
    case "high":
    case "low":
      return "bg-amber-100 text-amber-900 border-amber-300";
    case "abnormal":
      return "bg-orange-100 text-orange-800 border-orange-300";
    default:
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
};

const LabResults = ({
  selectedConsultation = null,
  appointmentId = "",
  clientId = "",
}) => {
  const targetClientId =
    clientId ||
    selectedConsultation?.clientId ||
    selectedConsultation?.patientId ||
    "";
  const targetAppointmentId =
    appointmentId || selectedConsultation?.appointmentId || "";
  const targetConsultationId = selectedConsultation?.id || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [flagFilter, setFlagFilter] = useState("all"); // all | flagged | normal
  const [expandedIds, setExpandedIds] = useState({});

  const formatDate = (val) => {
    if (!val) return "N/A";
    const d =
      typeof val === "object" && val?.seconds
        ? new Date(val.seconds * 1000)
        : new Date(val);
    return Number.isNaN(d.getTime())
      ? "N/A"
      : d.toLocaleDateString("en-KE", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const formatRefRange = (item) => {
    const explicit = toSafeText(item.referenceRange).trim();
    if (explicit) return explicit;
    const low = item.referenceLow;
    const high = item.referenceHigh;
    const hasLow = low !== null && low !== undefined && low !== "";
    const hasHigh = high !== null && high !== undefined && high !== "";
    if (hasLow && hasHigh) return `${low} - ${high}`;
    if (hasLow) return `>= ${low}`;
    if (hasHigh) return `<= ${high}`;
    return "—";
  };

  const fetchLabResults = async () => {
    setLoading(true);
    setError("");
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = {};
      if (targetConsultationId) params.consultationId = targetConsultationId;
      if (targetAppointmentId) params.appointmentId = targetAppointmentId;
      if (targetClientId) params.clientId = targetClientId;

      const response = await api.get("/clinic/lab-results", {
        params,
        headers,
      });

      const raw = response.data?.records ?? response.data;
      console.log(raw);
      const list = Array.isArray(raw) ? raw : [];
      setResults(list);

      // Expand all by default for easy reading by the doctor
      const initialExpanded = {};
      list.forEach((r, idx) => {
        initialExpanded[r.id || idx] = true;
      });
      setExpandedIds(initialExpanded);
    } catch (err) {
      const rawErr =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        err;
      setError(toSafeText(rawErr, "Failed to load lab results."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabResults();
  }, [targetClientId, targetAppointmentId, targetConsultationId]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      const flag = String(item.flag || "normal").toLowerCase();
      if (flagFilter === "flagged" && flag === "normal") return false;
      if (flagFilter === "normal" && flag !== "normal") return false;

      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;

      const matchesMain =
        toSafeText(item.testName).toLowerCase().includes(q) ||
        toSafeText(item.result).toLowerCase().includes(q) ||
        toSafeText(item.clientId).toLowerCase().includes(q) ||
        toSafeText(item.appointmentId).toLowerCase().includes(q) ||
        toSafeText(item.recordedBy).toLowerCase().includes(q) ||
        toSafeText(item.labNotes).toLowerCase().includes(q);

      const matchesPanel =
        Array.isArray(item.components) &&
        item.components.some(
          (c) =>
            toSafeText(c.name).toLowerCase().includes(q) ||
            toSafeText(c.value).toLowerCase().includes(q)
        );

      return matchesMain || matchesPanel;
    });
  }, [results, searchTerm, flagFilter]);

  return (
    <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6 print:p-0 print:border-none print:shadow-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FlaskConical className="text-purple-600" size={24} />
            Laboratory Results
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {targetClientId ? (
              <>
                Patient:{" "}
                <span className="font-mono font-semibold text-slate-700">
                  {targetClientId}
                </span>{" "}
                |{" "}
              </>
            ) : null}
            Total Results:{" "}
            <span className="font-bold text-slate-800">{results.length}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            <Printer size={15} /> Print
          </button>
          <button
            type="button"
            onClick={fetchLabResults}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Refresh Results"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Search & Flag Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="relative w-full sm:w-80">
          <Search
            className="absolute left-3 top-2.5 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search test, value, client, lab tech..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
          {[
            { key: "all", label: "All" },
            { key: "flagged", label: "Flagged" },
            { key: "normal", label: "Normal" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFlagFilter(tab.key)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                flagFilter === tab.key
                  ? "bg-white text-slate-800 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Results List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <RefreshCw className="animate-spin inline-block mr-2" size={18} />
          Loading laboratory results...
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
          No laboratory results found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((item, idx) => {
            const cardId = toSafeText(item.id, String(idx));
            const isOpen = Boolean(expandedIds[cardId]);
            const isPanel =
              item.resultType === "panel" && Array.isArray(item.components);

            return (
              <div
                key={cardId}
                className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs print:break-inside-avoid"
              >
                {/* Result Header */}
                <div
                  onClick={() => toggleExpand(cardId)}
                  className="p-4 bg-slate-50/70 hover:bg-slate-50 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {toSafeText(item.testName, "Lab Test")}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${flagBadgeClass(
                          item.flag
                        )}`}
                      >
                        {toSafeText(item.flag, "normal")}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 text-[10px] font-semibold uppercase">
                        {toSafeText(item.status, "final")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>
                        Client:{" "}
                        <strong className="font-mono text-slate-700">
                          {toSafeText(item.clientId, "N/A")}
                        </strong>
                      </span>
                      <span>
                        Appt:{" "}
                        <strong className="font-mono text-slate-700">
                          {toSafeText(item.appointmentId, "N/A")}
                        </strong>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} /> Tested:{" "}
                        {formatDate(item.testedAt || item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="self-end md:self-auto text-slate-400 hover:text-slate-600 print:hidden"
                  >
                    {isOpen ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </div>

                {/* Result Body */}
                {isOpen && (
                  <div className="p-4 space-y-3 text-xs text-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pb-2 border-b border-slate-100">
                      <span className="inline-flex items-center gap-1">
                        <User size={12} /> Recorded by:{" "}
                        <strong className="text-slate-700">
                          {toSafeText(item.recordedBy, "N/A")}
                        </strong>
                      </span>
                      {item.verifiedBy && (
                        <span>
                          Verified by:{" "}
                          <strong className="text-slate-700">
                            {toSafeText(item.verifiedBy)}
                          </strong>
                        </span>
                      )}
                      {item.specimenType && (
                        <span>
                          Specimen:{" "}
                          <strong className="text-slate-700">
                            {toSafeText(item.specimenType)}
                          </strong>
                          {item.specimenId
                            ? ` (${toSafeText(item.specimenId)})`
                            : ""}
                        </span>
                      )}
                    </div>

                    {isPanel ? (
                      <div className="border border-slate-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                            <tr>
                              <th className="p-2.5">Component</th>
                              <th className="p-2.5">Value</th>
                              <th className="p-2.5">Reference</th>
                              <th className="p-2.5">Flag</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {item.components.map((comp, cIdx) => (
                              <tr key={cIdx}>
                                <td className="p-2.5 font-semibold text-slate-800">
                                  {toSafeText(comp.name)}
                                </td>
                                <td className="p-2.5 font-mono text-slate-900">
                                  {toSafeText(comp.value)}{" "}
                                  <span className="text-slate-500">
                                    {toSafeText(comp.unit)}
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-500">
                                  {formatRefRange(comp)}
                                </td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${flagBadgeClass(
                                      comp.flag
                                    )}`}
                                  >
                                    {toSafeText(comp.flag, "normal")}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
                            Result
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {toSafeText(item.result, "—")}{" "}
                            <span className="text-xs font-medium text-slate-600">
                              {toSafeText(item.unit)}
                            </span>
                          </span>
                        </div>
                        {item.resultType === "numeric" && (
                          <div className="text-right">
                            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block mb-0.5">
                              Reference Range
                            </span>
                            <span className="font-mono text-slate-700">
                              {formatRefRange(item)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {item.labNotes && (
                      <div className="text-xs text-slate-600 bg-purple-50/40 border border-purple-100 rounded-lg p-2.5 flex items-start gap-1.5">
                        <FileText
                          size={14}
                          className="text-purple-500 shrink-0 mt-0.5"
                        />
                        <span>
                          <strong>Lab Notes:</strong> {toSafeText(item.labNotes)}
                        </span>
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

export default LabResults;