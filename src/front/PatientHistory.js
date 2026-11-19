import React, { useState, useEffect, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Printer,
    RefreshCw,
    Search,
    AlertCircle,
    ArrowDownWideNarrow,
    ArrowUpNarrowWide,
} from "lucide-react";
import api from "../services/api";

// ---------- helpers ----------
const toDate = (v) => {
    if (!v) return null;
    const d = v?.seconds ? new Date(v.seconds * 1000) : new Date(v);
    return isNaN(d.getTime()) ? null : d;
};

const formatDate = (v, withTime = true) => {
    const d = toDate(v);
    if (!d) return "N/A";
    return d.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
};

const recordTime = (r) => (toDate(r.createdAt || r.date) || new Date(0)).getTime();

// Small building blocks
const SectionTitle = ({ children }) => (
    <h4 className="text-[11px] font-bold tracking-wide text-slate-900 border-b border-slate-300 pb-1 mb-2">
        {children}
    </h4>
);

const Field = ({ label, value }) => (
    <div>
        <div className="text-[10px] text-slate-500">{label}</div>
        <div className="text-[13px] font-semibold text-slate-900">{value || "—"}</div>
    </div>
);

// ---------- component ----------
const PatientTreatmentHistory = ({ selectedConsultation = null, onBack }) => {
    const patientId = selectedConsultation?.patientId;
    const clientId = selectedConsultation?.clientId;
    const patientName =
        selectedConsultation?.patientName || selectedConsultation?.clientName || selectedConsultation?.name || "";

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"
    const [viewMode, setViewMode] = useState("single"); // "single" | "full"
    const [currentIndex, setCurrentIndex] = useState(0);
    const [expandedCards, setExpandedCards] = useState({});

    const fetchTreatmentHistory = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const targetId = patientId || clientId;

            if (!targetId) {
                setError("No patient ID provided to load history.");
                return;
            }

            const response = await api.get(`/clinic/treatment`, {
                params: { clientId: targetId },
                headers: { Authorization: `Bearer ${token}` },
            });

            const rawData = response.data?.records ?? response.data;
            setHistory(Array.isArray(rawData) ? rawData : []);
            setCurrentIndex(0);
        } catch (err) {
            setError(
                err.response?.data?.message || err.message || "Failed to load patient treatment history."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTreatmentHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientId, clientId]);

    // Sort + filter
    const visibleRecords = useMemo(() => {
        const q = searchTerm.toLowerCase();
        const sorted = [...history].sort((a, b) =>
            sortOrder === "newest" ? recordTime(b) - recordTime(a) : recordTime(a) - recordTime(b)
        );

        return sorted.filter((item) => {
            const matchesSearch =
                (item.diagnosisCode || "").toLowerCase().includes(q) ||
                (item.diagnosisNotes || "").toLowerCase().includes(q) ||
                (item.treatment || "").toLowerCase().includes(q) ||
                (item.prescription || []).some((p) => (p.medication || "").toLowerCase().includes(q));

            if (activeTab === "prescriptions") return matchesSearch && item.prescription?.length > 0;
            if (activeTab === "tests") return matchesSearch && item.tests?.length > 0;
            if (activeTab === "allergies") return matchesSearch && item.hasAllergies;
            return matchesSearch;
        });
    }, [history, searchTerm, activeTab, sortOrder]);

    // Keep index in range and jump back to first record when the list changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [sortOrder, searchTerm, activeTab]);

    const total = visibleRecords.length;
    const safeIndex = Math.min(currentIndex, Math.max(total - 1, 0));
    const recordsToShow = viewMode === "single" ? visibleRecords.slice(safeIndex, safeIndex + 1) : visibleRecords;

    const goPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));
    const goNext = () => setCurrentIndex((i) => Math.min(i + 1, total - 1));

    // react-to-print (v3 API). For v2 use: useReactToPrint({ content: () => printRef.current, ... })
    const printRef = useRef(null);
    const [pendingFullPrint, setPendingFullPrint] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Medical-Report-${patientName || patientId || clientId || "patient"}`,
        pageStyle: `
            @page { size: A4; margin: 14mm 12mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `,
    });

    const printVisit = () => handlePrint();

    // Switch to full record, wait for it to render, then print
    const printFullRecord = () => {
        if (viewMode === "full") return handlePrint();
        setViewMode("full");
        setPendingFullPrint(true);
    };

    useEffect(() => {
        if (pendingFullPrint && viewMode === "full") {
            setPendingFullPrint(false);
            handlePrint();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingFullPrint, viewMode]);

    const toggleCard = (id) => setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));

    const sortLabel = sortOrder === "newest" ? "Newest first" : "Oldest first";

    // ---------- render ----------
    return (
        <div className="max-w-4xl mx-auto text-slate-800 print:max-w-none">
            {/* ===== On-screen controls (hidden in print) ===== */}
            <div className="print:hidden mb-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="px-3 py-2 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-xs font-semibold"
                            >
                                ← Back
                            </button>
                        )}
                        <button
                            onClick={fetchTreatmentHistory}
                            disabled={loading}
                            title="Refresh records"
                            className="p-2 border border-slate-300 rounded-md bg-white hover:bg-slate-50"
                        >
                            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={printVisit}
                            disabled={total === 0}
                            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-md bg-white hover:bg-slate-50 text-xs font-semibold disabled:opacity-40"
                        >
                            <Printer size={14} /> {viewMode === "single" ? "Print this visit" : "Print full record"}
                        </button>
                        {viewMode === "single" && (
                            <button
                                onClick={printFullRecord}
                                disabled={total === 0}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-40"
                            >
                                <Printer size={14} /> Print full record
                            </button>
                        )}
                    </div>
                </div>

                {/* Navigator */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-300 rounded-md">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goPrev}
                            disabled={viewMode !== "single" || safeIndex <= 0}
                            className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={14} /> Previous
                        </button>
                        <span className="text-xs text-slate-600 min-w-[96px] text-center tabular-nums">
                            {total === 0 ? "No visits" : viewMode === "single" ? `Visit ${safeIndex + 1} of ${total}` : `${total} visits`}
                        </span>
                        <button
                            onClick={goNext}
                            disabled={viewMode !== "single" || safeIndex >= total - 1}
                            className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <button
                            onClick={() => setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md font-semibold hover:bg-slate-50"
                            title="Change sort order"
                        >
                            {sortOrder === "newest" ? <ArrowDownWideNarrow size={14} /> : <ArrowUpNarrowWide size={14} />}
                            {sortLabel}
                        </button>
                        <div className="flex border border-slate-300 rounded-md overflow-hidden font-semibold">
                            {[
                                ["single", "One visit"],
                                ["full", "Full record"],
                            ].map(([key, label]) => (
                                <button
                                    key={key}
                                    onClick={() => setViewMode(key)}
                                    className={`px-3 py-1.5 ${
                                        viewMode === key ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Search & filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search diagnosis, treatment, medication"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
                        />
                    </div>
                    <div className="flex gap-1 text-xs font-medium">
                        {["all", "prescriptions", "tests", "allergies"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`capitalize px-3 py-1.5 rounded-md border ${
                                    activeTab === tab
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                        <AlertCircle size={15} /> {error}
                    </div>
                )}
            </div>

            {/* ===== The report sheet ===== */}
            <div ref={printRef} className="bg-white border border-slate-300 shadow-sm print:shadow-none print:border-0 px-8 py-8 print:p-0">
                {/* Letterhead */}
                <header className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Medical Treatment Report</h1>
                        <p className="text-xs text-slate-500 mt-1">Confidential patient record</p>
                    </div>
                    <div className="text-right text-[11px] text-slate-500 leading-5">
                        <div>
                            Report generated: <span className="text-slate-800 font-semibold">{formatDate(new Date())}</span>
                        </div>
                        <div>
                            Scope:{" "}
                            <span className="text-slate-800 font-semibold">
                                {viewMode === "single" ? "Single visit" : `Full record (${total} visits, ${sortLabel.toLowerCase()})`}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Patient block */}
                <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-300">
                    <Field label="Patient name" value={patientName} />
                    <Field label="Patient ID" value={patientId || clientId} />
                    <Field label="Total visits on record" value={String(history.length)} />
                    <Field
                        label="Most recent visit"
                        value={history.length ? formatDate(Math.max(...history.map(recordTime)), false) : "—"}
                    />
                </section>

                {/* Records */}
                {loading ? (
                    <div className="py-16 text-center text-slate-400 text-xs print:hidden">
                        <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                        Retrieving treatment records…
                    </div>
                ) : total === 0 ? (
                    <div className="py-16 text-center text-slate-500 text-xs">
                        No treatment records match the current search or filter.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-300">
                        {recordsToShow.map((item, i) => {
                            const cardId = item.id || item._id || `${viewMode}-${i}`;
                            const visitNumber = viewMode === "single" ? safeIndex + 1 : i + 1;
                            const collapsible = viewMode === "full";
                            const isOpen = !collapsible || Boolean(expandedCards[cardId]) || i === 0;

                            return (
                                <article key={cardId} className="py-5 print:break-inside-avoid">
                                    {/* Visit header */}
                                    <div
                                        className={`flex items-start justify-between gap-3 ${collapsible ? "cursor-pointer print:cursor-auto" : ""}`}
                                        onClick={() => collapsible && toggleCard(cardId)}
                                    >
                                        <div>
                                            <div className="text-[11px] text-slate-500">Visit {visitNumber} of {total}</div>
                                            <h3 className="text-base font-bold text-slate-900">
                                                {formatDate(item.createdAt || item.date)}
                                            </h3>
                                            {item.diagnosisNotes && (
                                                <p className="text-[13px] text-slate-700 mt-0.5">{item.diagnosisNotes}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            {item.diagnosisCode && (
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-500">Diagnosis code</div>
                                                    <div className="font-mono text-sm font-bold text-slate-900 border border-slate-400 px-2 py-0.5 rounded">
                                                        {item.diagnosisCode}
                                                    </div>
                                                </div>
                                            )}
                                            {collapsible && (
                                                <span className="text-slate-400 print:hidden">
                                                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Visit body (always printed) */}
                                    <div className={`${isOpen ? "block" : "hidden print:block"} mt-4 space-y-4 text-[13px]`}>
                                        <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-600">
                                            <span>
                                                Attending doctor:{" "}
                                                <strong className="text-slate-900">{item.doctorEmail || "N/A"}</strong>
                                            </span>
                                            {item.appointmentId && (
                                                <span>
                                                    Appointment ref: <span className="font-mono">{item.appointmentId}</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Allergies */}
                                        {item.hasAllergies && item.allergiesList?.length > 0 && (
                                            <div className="border-l-4 border-red-700 bg-red-50 px-3 py-2 print:bg-red-50">
                                                <div className="text-[11px] font-bold text-red-800">Allergy alert</div>
                                                <div className="text-red-900 font-semibold">{item.allergiesList.join(", ")}</div>
                                            </div>
                                        )}

                                        {/* Vitals */}
                                        {item.vitalSigns && (
                                            <section>
                                                <SectionTitle>Vital signs</SectionTitle>
                                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                                    <Field label="Blood pressure" value={item.vitalSigns.bloodPressure} />
                                                    <Field
                                                        label="Pulse"
                                                        value={item.vitalSigns.pulse ? `${item.vitalSigns.pulse} bpm` : ""}
                                                    />
                                                    <Field
                                                        label="Temperature"
                                                        value={item.vitalSigns.temperature ? `${item.vitalSigns.temperature} °C` : ""}
                                                    />
                                                    <Field
                                                        label="SpO₂"
                                                        value={item.vitalSigns.oxygenSaturation ? `${item.vitalSigns.oxygenSaturation} %` : ""}
                                                    />
                                                    <Field label="Respiratory rate" value={item.vitalSigns.respiratoryRate} />
                                                </div>
                                            </section>
                                        )}

                                        {/* Treatment */}
                                        {item.treatment && (
                                            <section>
                                                <SectionTitle>Treatment / procedure</SectionTitle>
                                                <p className="leading-relaxed">{item.treatment}</p>
                                            </section>
                                        )}

                                        {/* Prescriptions */}
                                        {item.prescription?.length > 0 && (
                                            <section>
                                                <SectionTitle>Prescribed medication</SectionTitle>
                                                <table className="w-full text-left border border-slate-300">
                                                    <thead className="bg-slate-100 text-[11px] text-slate-600">
                                                        <tr>
                                                            <th className="p-2 border-b border-slate-300 w-10">No.</th>
                                                            <th className="p-2 border-b border-slate-300">Medication</th>
                                                            <th className="p-2 border-b border-slate-300">Dosage / frequency</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {item.prescription.map((rx, idx) => (
                                                            <tr key={idx} className="border-b border-slate-200 last:border-0">
                                                                <td className="p-2 text-slate-500">{idx + 1}</td>
                                                                <td className="p-2 font-semibold text-slate-900">{rx.medication}</td>
                                                                <td className="p-2 text-slate-700">{rx.frequency}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </section>
                                        )}

                                        {/* Tests */}
                                        {item.tests?.length > 0 && (
                                            <section>
                                                <SectionTitle>Laboratory tests requested</SectionTitle>
                                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 list-disc list-inside">
                                                    {item.tests.map((t, idx) => (
                                                        <li key={idx}>{t}</li>
                                                    ))}
                                                </ul>
                                            </section>
                                        )}

                                        {/* Notes & follow-up */}
                                        {(item.notes || item.followUpDate || item.followUpInterval) && (
                                            <section>
                                                <SectionTitle>Clinical notes and follow-up</SectionTitle>
                                                {item.notes && <p className="leading-relaxed">{item.notes}</p>}
                                                {(item.followUpDate || item.followUpInterval) && (
                                                    <p className="mt-1">
                                                        <span className="text-slate-500">Follow-up: </span>
                                                        <strong>
                                                            {item.followUpDate
                                                                ? formatDate(item.followUpDate, false)
                                                                : `in ${item.followUpInterval} days`}
                                                        </strong>
                                                    </p>
                                                )}
                                            </section>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Sign-off (print and screen) */}
                {!loading && total > 0 && (
                    <footer className="mt-6 pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-10 text-[11px] text-slate-500 print:break-inside-avoid">
                        <div>
                            <div className="border-b border-slate-400 h-8" />
                            <div className="mt-1">Physician signature and stamp</div>
                        </div>
                        <div>
                            <div className="border-b border-slate-400 h-8" />
                            <div className="mt-1">Date</div>
                        </div>
                        <p className="col-span-2 text-[10px] leading-4">
                            This document contains confidential medical information intended only for the patient and
                            authorised healthcare providers. Unauthorised use or disclosure is prohibited.
                        </p>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default PatientTreatmentHistory;