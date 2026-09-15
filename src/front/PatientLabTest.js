import React, { useState, useEffect } from "react";
import {
    FlaskConical,
    Search,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    FileText,
    Clock,
    User,
    ChevronRight,
    Save,
    X,
} from "lucide-react";
import api from "../services/api";

const PatientLabTests = () => {
    const [labOrders, setLabOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("pending"); // "pending" | "completed" | "all"

    // Modal / Active Recording Form State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedTest, setSelectedTest] = useState(null);
    const [testResult, setTestResult] = useState("");
    const [unit, setUnit] = useState("");
    const [referenceRange, setReferenceRange] = useState("");
    const [labNotes, setLabNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Fetch Lab Orders
    const fetchLabOrders = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const response = await api.get(`/clinic/consultation`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const rawData = response.data?.records ?? response.data;
            const list = Array.isArray(rawData) ? rawData : [];
            setLabOrders(list);
        } catch (err) {
            setError(
                err.response?.data?.message || err.message || "Failed to load lab requisitions."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabOrders();
    }, []);

    // Open Modal for Result Recording
    const handleRecordResult = (order, testName) => {
        setSelectedOrder(order);
        setSelectedTest(testName);
        setTestResult("");
        setUnit("");
        setReferenceRange("");
        setLabNotes("");
        setSuccessMsg("");
        setError("");
    };

    // Submit Result Form
    const handleSaveResult = async (e) => {
        e.preventDefault();
        if (!testResult.trim()) {
            setError("Please enter the test result value.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const payload = {
                orderId: selectedOrder.id || selectedOrder._id,
                patientId: selectedOrder.patientId || selectedOrder.clientId,
                testName: selectedTest,
                result: testResult,
                unit,
                referenceRange,
                labNotes,
                recordedAt: new Date().toISOString(),
            };

            await api.post(`/clinic/lab-results`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSuccessMsg(`Result for ${selectedTest} recorded successfully.`);
            setSelectedOrder(null);
            setSelectedTest(null);
            fetchLabOrders(); // Refresh table
        } catch (err) {
            setError(
                err.response?.data?.message || err.message || "Failed to save lab result."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Safe Date Formatter
    const formatDate = (dateVal) => {
        if (!dateVal) return "N/A";
        const dateObj = dateVal?.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
        return isNaN(dateObj.getTime())
            ? "N/A"
            : dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
              });
    };

    // Filtering Logic
    const filteredOrders = labOrders.filter((order) => {
        const matchesSearch =
            (order.patientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.patientId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.tests || []).some((t) =>
                (typeof t === "string" ? t : t.name || "").toLowerCase().includes(searchTerm.toLowerCase())
            );

        const isCompleted = order.status === "completed" || order.isCompleted;

        if (activeFilter === "pending") return matchesSearch && !isCompleted;
        if (activeFilter === "completed") return matchesSearch && isCompleted;
        return matchesSearch;
    });

    return (
        <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                        <FlaskConical size={22} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Laboratory Requisitions</h2>
                        <p className="text-xs text-slate-500">
                            Process lab tests and record patient diagnostic results
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchLabOrders}
                    disabled={loading}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors self-start md:self-auto"
                    title="Refresh Lab Orders"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Success & Error Messages */}
            {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    {successMsg}
                </div>
            )}
            {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search patient, ID, or test name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
                    {["pending", "completed", "all"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveFilter(tab)}
                            className={`capitalize px-3 py-1.5 rounded-md transition-all ${
                                activeFilter === tab
                                    ? "bg-white text-slate-800 shadow-xs font-bold"
                                    : "text-slate-500 hover:text-slate-700"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lab Orders List */}
            {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                    <RefreshCw className="animate-spin inline-block mr-2" size={18} />
                    Fetching requested lab tests...
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                    No lab requisitions found matching current filter.
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order, idx) => {
                        const orderId = order.id || order._id || idx;
                        const testsList = Array.isArray(order.tests) ? order.tests : [];

                        return (
                            <div
                                key={orderId}
                                className="border border-slate-200 rounded-xl bg-white p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                            >
                                {/* Order Metadata Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800">
                                                {order.patientName || "Unnamed Patient"}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 font-mono">
                                                Patient ID: {order.patientId || order.clientId || "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock size={13} /> {formatDate(order.createdAt || order.date)}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 text-[10px] uppercase">
                                            Doctor: {order.doctorEmail || "Attending MD"}
                                        </span>
                                    </div>
                                </div>

                                {/* Recommended Tests List */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Recommended Tests ({testsList.length})
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {testsList.map((test, tIdx) => {
                                            const testName = typeof test === "string" ? test : test.name;
                                            const isDone = typeof test === "object" ? test.completed : order.results?.[testName];

                                            return (
                                                <div
                                                    key={tIdx}
                                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <FlaskConical size={15} className="text-purple-600" />
                                                        <span className="text-xs font-semibold text-slate-800">
                                                            {testName}
                                                        </span>
                                                    </div>

                                                    {isDone ? (
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                            <CheckCircle2 size={11} /> Recorded
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleRecordResult(order, testName)}
                                                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[11px] font-medium transition-colors flex items-center gap-1"
                                                        >
                                                            Record <ChevronRight size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Record Result Modal */}
            {selectedOrder && selectedTest && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                                <FlaskConical size={18} />
                                Record Test Result
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedOrder(null);
                                    setSelectedTest(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1 text-xs">
                            <p className="text-slate-500">
                                Patient: <strong className="text-slate-800">{selectedOrder.patientName || selectedOrder.patientId}</strong>
                            </p>
                            <p className="text-slate-500">
                                Test: <strong className="text-purple-700">{selectedTest}</strong>
                            </p>
                        </div>

                        <form onSubmit={handleSaveResult} className="space-y-3 text-xs">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Test Result Value <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 13.5, Positive, 98"
                                    value={testResult}
                                    onChange={(e) => setTestResult(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Unit (optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. g/dL, mg/dL, %"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Ref. Range (optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 12.0 - 15.5"
                                        value={referenceRange}
                                        onChange={(e) => setReferenceRange(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Pathologist / Lab Notes
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="Add clinical observations or notes..."
                                    value={labNotes}
                                    onChange={(e) => setLabNotes(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                ></textarea>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedOrder(null);
                                        setSelectedTest(null);
                                    }}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5"
                                >
                                    <Save size={14} />
                                    {submitting ? "Saving..." : "Save Result"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientLabTests;