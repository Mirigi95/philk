import React, { useState, useEffect } from "react";
import { FlaskConical, Search, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../services/api";
import LabOrdersTable from "../forms/LabOrdersTable";
import RecordResultModal from "../forms/REcordResultModal";

const PatientLabTests = () => {
    const [labOrders, setLabOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("pending"); // "pending" | "completed" | "all"

    // Which test the modal is open for (null = closed)
    const [recording, setRecording] = useState(null); // { order, testName }

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
            setLabOrders(Array.isArray(rawData) ? rawData : []);
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

    const handleRecordResult = (order, testName) => {
        setSuccessMsg("");
        setError("");
        setRecording({ order, testName });
    };

    const handleSaved = (message) => {
        setSuccessMsg(message);
        setRecording(null);
        fetchLabOrders();
    };

    // Filtering Logic
    const term = searchTerm.toLowerCase();
    const filteredOrders = labOrders.filter((order) => {
        const matchesSearch =
            String(order.patientName || "").toLowerCase().includes(term) ||
            String(order.patientId || "").toLowerCase().includes(term) ||
            (order.tests || []).some((t) =>
                (typeof t === "string" ? t : t.name || "").toLowerCase().includes(term)
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

            {/* Table */}
            <LabOrdersTable
                orders={filteredOrders}
                loading={loading}
                onRecord={handleRecordResult}
            />

            {/* Modal Form */}
            {recording && (
                <RecordResultModal
                    order={recording.order}
                    testName={recording.testName}
                    onClose={() => setRecording(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
};

export default PatientLabTests;