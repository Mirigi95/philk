import React from "react";
import {
    FlaskConical,
    RefreshCw,
    CheckCircle2,
    Clock,
    User,
    ChevronRight,
    AlertTriangle,
} from "lucide-react";

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

// ---------- Result helpers ----------
const getTestName = (test) => (typeof test === "string" ? test : test?.name);

// A recorded result can live on the test object (test.result) or on order.results[testName].
const getResult = (order, test) => {
    const name = getTestName(test);
    const fromTest = typeof test === "object" ? test.result : undefined;
    return fromTest ?? order.results?.[name];
};

const isTestDone = (order, test) => {
    if (typeof test === "object" && test.completed) return true;
    const r = getResult(order, test);
    return r !== undefined && r !== null && r !== "";
};

// Turn a stored result (string, single-value object, or panel object) into display bits.
const summarizeResult = (result) => {
    if (result === undefined || result === null || result === "") return null;
    if (typeof result !== "object") return { text: String(result), flag: null, status: null };

    if (Array.isArray(result.components) && result.components.length > 0) {
        const flagged = result.components.filter((c) => c.flag && c.flag !== "normal").length;
        return {
            text: `${result.components.length} components`,
            flaggedCount: flagged,
            flag: result.flag || null,
            status: result.status || null,
        };
    }

    const value = result.result ?? result.value ?? "";
    return {
        text: `${value}${result.unit ? ` ${result.unit}` : ""}`.trim() || "Recorded",
        flag: result.flag || null,
        status: result.status || null,
    };
};

const FLAG_STYLES = {
    normal: "bg-emerald-100 text-emerald-800",
    high: "bg-amber-100 text-amber-800",
    low: "bg-amber-100 text-amber-800",
    abnormal: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
};

const tileClasses = (flag) => {
    if (flag === "critical") return "bg-red-50 border-red-200";
    if (flag && flag !== "normal") return "bg-amber-50 border-amber-200";
    return "bg-slate-50 border-slate-100";
};

/**
 * Presentational list of lab orders and their requested tests.
 *
 * Props:
 *  - orders:   already-filtered array of lab orders
 *  - loading:  boolean
 *  - onRecord: (order, testName) => void – user clicked "Record" on a test
 */
const LabOrdersTable = ({ orders, loading, onRecord }) => {
    if (loading) {
        return (
            <div className="py-12 text-center text-slate-400 text-xs">
                <RefreshCw className="animate-spin inline-block mr-2" size={18} />
                Fetching requested lab tests...
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                No lab requisitions found matching current filter.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map((order, idx) => {
                const orderId = order.id || order._id || idx;
                const testsList = Array.isArray(order.tests) ? order.tests : [];
                const doneCount = testsList.filter((t) => isTestDone(order, t)).length;

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
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Recommended Tests ({testsList.length})
                                </h4>
                                {testsList.length > 0 && (
                                    <span className="text-[11px] text-slate-500">
                                        {doneCount} of {testsList.length} recorded
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {testsList.map((test, tIdx) => {
                                    const testName = getTestName(test);
                                    const done = isTestDone(order, test);
                                    const summary = done ? summarizeResult(getResult(order, test)) : null;
                                    const flag = summary?.flag;

                                    return (
                                        <div
                                            key={tIdx}
                                            className={`p-3 rounded-lg border space-y-2 ${
                                                done ? tileClasses(flag) : "bg-slate-50 border-slate-100"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FlaskConical
                                                        size={15}
                                                        className="text-purple-600 shrink-0"
                                                    />
                                                    <span className="text-xs font-semibold text-slate-800 truncate">
                                                        {testName}
                                                    </span>
                                                </div>

                                                {done ? (
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                                                        <CheckCircle2 size={11} /> Recorded
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => onRecord(order, testName)}
                                                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0"
                                                    >
                                                        Record <ChevronRight size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Result summary for recorded tests */}
                                            {summary && (
                                                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                                    <span className="font-mono font-semibold text-slate-800 max-w-full truncate">
                                                        {summary.text}
                                                    </span>
                                                    {flag && flag !== "normal" && (
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded-full font-bold uppercase text-[9px] flex items-center gap-1 ${
                                                                FLAG_STYLES[flag] || FLAG_STYLES.abnormal
                                                            }`}
                                                        >
                                                            {flag === "critical" && <AlertTriangle size={10} />}
                                                            {flag}
                                                        </span>
                                                    )}
                                                    {summary.flaggedCount > 0 && (
                                                        <span className="text-amber-700">
                                                            ({summary.flaggedCount} flagged)
                                                        </span>
                                                    )}
                                                    {summary.status && summary.status !== "final" && (
                                                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold uppercase text-[9px]">
                                                            {summary.status}
                                                        </span>
                                                    )}
                                                </div>
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
    );
};

export default LabOrdersTable;