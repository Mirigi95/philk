import React, { useState, useEffect, useMemo } from "react";
import { FlaskConical, Save, X, AlertCircle, Plus, Trash2, Wand2 } from "lucide-react";
import api from "../services/api";


const RESULT_TYPES = [
    { value: "numeric", label: "Numeric" },
    { value: "qualitative", label: "Qualitative" },
    { value: "semi_quantitative", label: "Semi-quant." },
    { value: "text", label: "Free text" },
    { value: "panel", label: "Panel" },
];

const QUALITATIVE_OPTIONS = ["Negative", "Positive", "Non-reactive", "Reactive", "Indeterminate"];
const SEMI_QUANT_OPTIONS = ["Negative", "Trace", "1+", "2+", "3+", "4+"];

const FLAGS = [
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
    { value: "low", label: "Low" },
    { value: "abnormal", label: "Abnormal" },
    { value: "critical", label: "Critical" },
];

const SPECIMEN_TYPES = [
    "Whole blood",
    "Serum",
    "Plasma",
    "Urine",
    "Stool",
    "Swab",
    "Sputum",
    "CSF",
    "Other",
];

const STATUSES = [
    { value: "final", label: "Final" },
    { value: "preliminary", label: "Preliminary" },
    { value: "corrected", label: "Corrected" },
    { value: "amended", label: "Amended" },
];

// Component names + units only. Reference ranges vary by lab, sex and age, so they are left for the user.
const PANEL_TEMPLATES = [
    {
        match: /\b(cbc|fbc|full blood count|complete blood count)\b/i,
        label: "Full blood count",
        components: [
            ["Hemoglobin", "g/dL"],
            ["WBC", "x10^9/L"],
            ["RBC", "x10^12/L"],
            ["Hematocrit", "%"],
            ["MCV", "fL"],
            ["MCH", "pg"],
            ["MCHC", "g/dL"],
            ["Platelets", "x10^9/L"],
        ],
    },
    {
        match: /\b(lft|liver function)/i,
        label: "Liver function",
        components: [
            ["ALT", "U/L"],
            ["AST", "U/L"],
            ["ALP", "U/L"],
            ["GGT", "U/L"],
            ["Total bilirubin", "µmol/L"],
            ["Direct bilirubin", "µmol/L"],
            ["Albumin", "g/L"],
            ["Total protein", "g/L"],
        ],
    },
    {
        match: /\b(u\s*&?\s*e|u&es|renal function|kidney function|electrolytes)/i,
        label: "Urea & electrolytes",
        components: [
            ["Sodium", "mmol/L"],
            ["Potassium", "mmol/L"],
            ["Chloride", "mmol/L"],
            ["Bicarbonate", "mmol/L"],
            ["Urea", "mmol/L"],
            ["Creatinine", "µmol/L"],
        ],
    },
    {
        match: /\b(lipid)/i,
        label: "Lipid profile",
        components: [
            ["Total cholesterol", "mmol/L"],
            ["HDL", "mmol/L"],
            ["LDL", "mmol/L"],
            ["Triglycerides", "mmol/L"],
        ],
    },
    {
        match: /\b(urinalysis|urine analysis|urine dipstick)/i,
        label: "Urinalysis",
        components: [
            ["Protein", ""],
            ["Glucose", ""],
            ["Ketones", ""],
            ["Blood", ""],
            ["Leukocytes", ""],
            ["Nitrites", ""],
            ["pH", ""],
            ["Specific gravity", ""],
        ],
    },
];

const findTemplate = (testName) => PANEL_TEMPLATES.find((t) => t.match.test(testName || ""));

const emptyComponent = () => ({ name: "", value: "", unit: "", low: "", high: "", flag: null });

const buildComponents = (tpl) =>
    tpl
        ? tpl.components.map(([name, unit]) => ({ ...emptyComponent(), name, unit }))
        : [emptyComponent(), emptyComponent()];

// ---------- Helpers ----------
// datetime-local needs *local* time, not UTC
const toLocalInput = (d = new Date()) =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

const parseLocal = (s) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
};

const toNumber = (s) => {
    const str = String(s ?? "").trim();
    if (str === "") return null;
    const n = Number(str);
    return isNaN(n) ? null : n;
};

// Suggest a flag from value vs. reference limits. Returns null when it can't decide.
const computeFlag = (value, low, high) => {
    const v = toNumber(value);
    if (v === null) return null;
    const l = toNumber(low);
    const h = toNumber(high);
    if (l !== null && v < l) return "low";
    if (h !== null && v > h) return "high";
    if (l !== null || h !== null) return "normal";
    return null;
};

const flagClasses = (flag) => {
    switch (flag) {
        case "high":
        case "low":
            return "bg-amber-50 border-amber-300 text-amber-800";
        case "abnormal":
            return "bg-orange-50 border-orange-300 text-orange-800";
        case "critical":
            return "bg-red-50 border-red-300 text-red-800";
        default:
            return "bg-white border-slate-200 text-slate-700";
    }
};

const SEVERITY = { normal: 0, high: 1, low: 1, abnormal: 1, critical: 2 };
const worstFlag = (flags) =>
    flags.reduce((worst, f) => (SEVERITY[f] > SEVERITY[worst] ? f : worst), "normal");

const refRangeString = (low, high) => {
    const l = String(low ?? "").trim();
    const h = String(high ?? "").trim();
    if (l && h) return `${l} - ${h}`;
    if (l) return `≥ ${l}`;
    if (h) return `≤ ${h}`;
    return "";
};

const inputCls =
    "w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20";
const labelCls = "block font-semibold text-slate-700 mb-1";

// ---------- Component ----------
const RecordResultModal = ({ order, testName, onClose, onSaved }) => {
    const template = useMemo(() => findTemplate(testName), [testName]);

    // Result
    const [resultType, setResultType] = useState(template ? "panel" : "numeric");
    const [testResult, setTestResult] = useState("");
    const [unit, setUnit] = useState("");
    const [refLow, setRefLow] = useState("");
    const [refHigh, setRefHigh] = useState("");
    const [manualFlag, setManualFlag] = useState(null); // null = use auto/normal
    const [components, setComponents] = useState(() => buildComponents(template));

    // Specimen & timing
    const [specimenType, setSpecimenType] = useState("");
    const [specimenId, setSpecimenId] = useState("");
    const [collectedAt, setCollectedAt] = useState("");
    const [resultedAt, setResultedAt] = useState(() => toLocalInput());

    // Workflow
    const [status, setStatus] = useState("final");
    const [verifiedBy, setVerifiedBy] = useState("");
    const [labNotes, setLabNotes] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Close on Escape
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape" && !submitting) onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose, submitting]);

    // ----- Derived flag state -----
    const autoFlag = resultType === "numeric" ? computeFlag(testResult, refLow, refHigh) : null;
    const effectiveFlag = manualFlag ?? autoFlag ?? "normal";

    const componentFlag = (c) => c.flag ?? computeFlag(c.value, c.low, c.high) ?? "normal";
    const abnormalCount = components.filter(
        (c) => c.value.trim() && componentFlag(c) !== "normal"
    ).length;

    // ----- Handlers -----
    const handleTypeChange = (type) => {
        setResultType(type);
        setTestResult("");
        setManualFlag(null);
        setError("");
        if (type === "panel" && components.every((c) => !c.name && !c.value)) {
            setComponents(buildComponents(template));
        }
    };

    const updateComponent = (idx, patch) =>
        setComponents((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
    const addComponent = () => setComponents((rows) => [...rows, emptyComponent()]);
    const removeComponent = (idx) => setComponents((rows) => rows.filter((_, i) => i !== idx));
    const loadTemplate = () => setComponents(buildComponents(template));

    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- Validation ---
        const collected = parseLocal(collectedAt);
        const resulted = parseLocal(resultedAt) || new Date();
        if (collected && collected > resulted) {
            setError("Collection time cannot be after the result time.");
            return;
        }

        let filledComponents = [];
        if (resultType === "panel") {
            filledComponents = components.filter((c) => c.name.trim() || c.value.trim());
            if (filledComponents.length === 0 || !filledComponents.some((c) => c.value.trim())) {
                setError("Enter a value for at least one panel component.");
                return;
            }
            if (filledComponents.some((c) => c.value.trim() && !c.name.trim())) {
                setError("Every component with a value needs a name.");
                return;
            }
            filledComponents = filledComponents.filter((c) => c.value.trim());
        } else if (!testResult.trim()) {
            setError("Please enter the test result value.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");

            const payload = {
                orderId: order.id || order._id,
                appointmentId: order.appointmentId,
                patientId: order.patientId || order.clientId,
                testName,
                resultType,
                status,
                specimenType: specimenType || undefined,
                specimenId: specimenId.trim() || undefined,
                collectedAt: collected ? collected.toISOString() : undefined,
                testedAt: resulted.toISOString(),
                verifiedBy: verifiedBy.trim() || undefined,
                labNotes,
                recordedAt: new Date().toISOString(),
            };

            if (resultType === "panel") {
                const comps = filledComponents.map((c) => ({
                    name: c.name.trim(),
                    value: c.value.trim(),
                    unit: c.unit.trim(),
                    referenceLow: toNumber(c.low),
                    referenceHigh: toNumber(c.high),
                    referenceRange: refRangeString(c.low, c.high),
                    flag: componentFlag(c),
                }));
                payload.components = comps;
                payload.flag = worstFlag(comps.map((c) => c.flag));
            } else {
                payload.result = testResult.trim();
                payload.flag = effectiveFlag;
                if (resultType === "numeric") {
                    payload.unit = unit.trim();
                    payload.referenceLow = toNumber(refLow);
                    payload.referenceHigh = toNumber(refHigh);
                    payload.referenceRange = refRangeString(refLow, refHigh);
                }
            }

            await api.post(`/clinic/lab-results`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            onSaved(`Result for ${testName} recorded successfully.`);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to save lab result.");
        } finally {
            setSubmitting(false);
        }
    };

    // ----- Interpretation select (shared by single-value types) -----
    const renderInterpretation = () => (
        <div>
            <label className={labelCls}>
                Interpretation
                {autoFlag && manualFlag === null && (
                    <span className="ml-1 font-normal text-slate-400">(auto)</span>
                )}
            </label>
            <select
                value={effectiveFlag}
                onChange={(e) => setManualFlag(e.target.value)}
                className={`w-full px-2 py-2 border rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${flagClasses(
                    effectiveFlag
                )}`}
            >
                {FLAGS.map((f) => (
                    <option key={f.value} value={f.value}>
                        {f.label}
                    </option>
                ))}
            </select>
        </div>
    );

    return (
        <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !submitting) onClose();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-result-title"
        >
            <div
                className={`bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 animate-in fade-in zoom-in duration-150 ${
                    resultType === "panel" ? "max-w-3xl" : "max-w-lg"
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div
                        id="record-result-title"
                        className="flex items-center gap-2 text-purple-700 font-bold text-sm"
                    >
                        <FlaskConical size={18} />
                        Record Test Result
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Order summary */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                        <p className="text-slate-500">
                            Patient:{" "}
                            <strong className="text-slate-800">
                                {order.patientName || order.patientId}
                            </strong>
                        </p>
                        <p className="text-slate-500 mt-0.5">
                            Test: <strong className="text-purple-700">{testName}</strong>
                        </p>
                    </div>
                    <div className="text-right text-slate-400 font-mono text-[11px]">
                        Appointment ID: {String(order.appointmentId || order._id || "").slice(-8)}
                    </div>
                </div>

                {/* Error (scoped to the modal) */}
                {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    {/* Result type switch */}
                    <div>
                        <label className={labelCls}>Result type</label>
                        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg font-medium">
                            {RESULT_TYPES.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => handleTypeChange(t.value)}
                                    className={`flex-1 min-w-fit px-3 py-1.5 rounded-md transition-all ${
                                        resultType === t.value
                                            ? "bg-white text-purple-700 shadow-xs font-bold"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ---------- Result inputs, by type ---------- */}
                    {resultType === "numeric" && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className={labelCls}>
                                        Test Result Value <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        autoFocus
                                        placeholder="e.g. 13.5, <5, >200"
                                        value={testResult}
                                        onChange={(e) => setTestResult(e.target.value)}
                                        className={inputCls}
                                    />
                                </div>
                                {renderInterpretation()}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className={labelCls}>Unit</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. g/dL"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Ref. low</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="e.g. 12.0"
                                        value={refLow}
                                        onChange={(e) => setRefLow(e.target.value)}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Ref. high</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="e.g. 15.5"
                                        value={refHigh}
                                        onChange={(e) => setRefHigh(e.target.value)}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {(resultType === "qualitative" || resultType === "semi_quantitative") && (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className={labelCls}>
                                    Result <span className="text-red-500">*</span>
                                </label>
                                <select
                                    autoFocus
                                    value={testResult}
                                    onChange={(e) => setTestResult(e.target.value)}
                                    className={inputCls}
                                >
                                    <option value="">Select result…</option>
                                    {(resultType === "qualitative"
                                        ? QUALITATIVE_OPTIONS
                                        : SEMI_QUANT_OPTIONS
                                    ).map((o) => (
                                        <option key={o} value={o}>
                                            {o}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {renderInterpretation()}
                        </div>
                    )}

                    {resultType === "text" && (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <label className={labelCls}>
                                    Findings <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows="4"
                                    autoFocus
                                    placeholder="e.g. microscopy findings, film comment, histology report…"
                                    value={testResult}
                                    onChange={(e) => setTestResult(e.target.value)}
                                    className={inputCls}
                                ></textarea>
                            </div>
                            {renderInterpretation()}
                        </div>
                    )}

                    {resultType === "panel" && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="font-semibold text-slate-700">
                                    Components
                                    {abnormalCount > 0 && (
                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                            {abnormalCount} flagged
                                        </span>
                                    )}
                                </label>
                                {template && (
                                    <button
                                        type="button"
                                        onClick={loadTemplate}
                                        className="flex items-center gap-1 text-purple-700 hover:text-purple-900 font-medium"
                                    >
                                        <Wand2 size={13} /> Reset to {template.label}
                                    </button>
                                )}
                            </div>

                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <div className="hidden md:grid grid-cols-12 gap-2 px-2 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <div className="col-span-3">Analyte</div>
                                    <div className="col-span-2">Value</div>
                                    <div className="col-span-2">Unit</div>
                                    <div className="col-span-1">Low</div>
                                    <div className="col-span-1">High</div>
                                    <div className="col-span-2">Flag</div>
                                    <div className="col-span-1"></div>
                                </div>
                                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                                    {components.map((c, idx) => {
                                        const f = componentFlag(c);
                                        const isAuto = c.flag === null && computeFlag(c.value, c.low, c.high);
                                        return (
                                            <div
                                                key={idx}
                                                className="grid grid-cols-12 gap-2 px-2 py-1.5 items-center"
                                            >
                                                <input
                                                    type="text"
                                                    placeholder="Analyte"
                                                    value={c.name}
                                                    onChange={(e) =>
                                                        updateComponent(idx, { name: e.target.value })
                                                    }
                                                    className={`${inputCls} col-span-12 md:col-span-3 !py-1.5`}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Value"
                                                    value={c.value}
                                                    onChange={(e) =>
                                                        updateComponent(idx, { value: e.target.value })
                                                    }
                                                    className={`${inputCls} col-span-4 md:col-span-2 !py-1.5`}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Unit"
                                                    value={c.unit}
                                                    onChange={(e) =>
                                                        updateComponent(idx, { unit: e.target.value })
                                                    }
                                                    className={`${inputCls} col-span-4 md:col-span-2 !py-1.5`}
                                                />
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="Low"
                                                    value={c.low}
                                                    onChange={(e) =>
                                                        updateComponent(idx, { low: e.target.value })
                                                    }
                                                    className={`${inputCls} col-span-2 md:col-span-1 !py-1.5 !px-2`}
                                                />
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="High"
                                                    value={c.high}
                                                    onChange={(e) =>
                                                        updateComponent(idx, { high: e.target.value })
                                                    }
                                                    className={`${inputCls} col-span-2 md:col-span-1 !py-1.5 !px-2`}
                                                />
                                                <select
                                                    value={f}
                                                    onChange={(e) =>
                                                        updateComponent(idx, { flag: e.target.value })
                                                    }
                                                    title={isAuto ? "Auto-calculated from reference range" : ""}
                                                    className={`col-span-8 md:col-span-2 px-2 py-1.5 border rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 ${flagClasses(
                                                        f
                                                    )}`}
                                                >
                                                    {FLAGS.map((fl) => (
                                                        <option key={fl.value} value={fl.value}>
                                                            {fl.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => removeComponent(idx)}
                                                    disabled={components.length <= 1}
                                                    className="col-span-4 md:col-span-1 justify-self-end text-slate-400 hover:text-red-600 disabled:opacity-30 p-1"
                                                    aria-label="Remove component"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={addComponent}
                                className="flex items-center gap-1 text-purple-700 hover:text-purple-900 font-medium"
                            >
                                <Plus size={14} /> Add component
                            </button>
                            <p className="text-slate-400">
                                Rows left without a value are not saved. Flags are suggested from the
                                low/high limits and can be overridden.
                            </p>
                        </div>
                    )}

                    {/* ---------- Specimen & timing ---------- */}
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                        <div>
                            <label className={labelCls}>Specimen type</label>
                            <select
                                value={specimenType}
                                onChange={(e) => setSpecimenType(e.target.value)}
                                className={inputCls}
                            >
                                <option value="">Not specified</option>
                                {SPECIMEN_TYPES.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Specimen / accession ID</label>
                            <input
                                type="text"
                                placeholder="e.g. LAB-2026-00123"
                                value={specimenId}
                                onChange={(e) => setSpecimenId(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Collected at</label>
                            <input
                                type="datetime-local"
                                value={collectedAt}
                                onChange={(e) => setCollectedAt(e.target.value)}
                                className={`${inputCls} text-slate-700`}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Resulted at</label>
                            <input
                                type="datetime-local"
                                value={resultedAt}
                                onChange={(e) => setResultedAt(e.target.value)}
                                className={`${inputCls} text-slate-700`}
                            />
                        </div>
                    </div>

                    {/* ---------- Workflow ---------- */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Result status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={inputCls}
                            >
                                {STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Verified / authorized by</label>
                            <input
                                type="text"
                                placeholder="Name of technologist or pathologist"
                                value={verifiedBy}
                                onChange={(e) => setVerifiedBy(e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelCls}>Pathologist / Lab Notes</label>
                        <textarea
                            rows="2"
                            placeholder="Add clinical observations, instrument notes, or comments..."
                            value={labNotes}
                            onChange={(e) => setLabNotes(e.target.value)}
                            className={inputCls}
                        ></textarea>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5"
                        >
                            <Save size={14} />
                            {submitting ? "Saving..." : "Save Result"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecordResultModal;