import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  FileText,
  Save,
  Plus,
  X,
  Thermometer,
  Heart,
  Wind,
  ShieldAlert,
  UserCheck,
  FlaskConical, // Added missing icon
} from "lucide-react";
import api from "../services/api";

const ConsultationForm = ({ appointmentData, onCancel, onSuccess }) => {
  const appointmentId = appointmentData?.appointmentId;
  const patientName = appointmentData?.patientName;
  const clientId = appointmentData?.clientId;

  const [formData, setFormData] = useState({
    appointmentId: appointmentId || "",
    clientId: clientId || "",
    doctor: "dan",
    chiefComplaint: "",
    associatedSymptoms: "",
    onset: "",
    duration: "",
    severity: "",
    historyOfIllness: "",
    reviewOfSystems: "",
    physicalExam: "",
    assessment: "",
    diagnosisCode: "",
    plan: "",
    medications: "",
    notes: "",
    followUpDate: "",
    tests: [], // Added missing array field

    // History Flags & Fields
    hasAllergies: false,
    allergiesList: [],
    allergies: "",
    hasHistory: false,
    patientHistory: "",
    familyHistory: "",
    hasSocialHistory: false,
    socialHistory: "",

    // Nested Vital Signs
    vitalSigns: {
      bloodPressure: "",
      temperature: "",
      pulse: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      painLevel: "0",
    },
  });

  const [currentAllergyInput, setCurrentAllergyInput] = useState("");
  const [currentTestInput, setCurrentTestInput] = useState(""); // Added missing state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync external props if they change
  useEffect(() => {
    if (appointmentId || clientId) {
      setFormData((prev) => ({
        ...prev,
        appointmentId: appointmentId || prev.appointmentId,
        clientId: clientId || prev.clientId,
      }));
    }
  }, [appointmentId, clientId]);

  // Top-level input change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Lab Tests Management
  const handleAddTest = (e) => {
    if (e) e.preventDefault();
    const trimmed = currentTestInput.trim();
    if (!trimmed) return;

    if (!formData.tests.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        tests: [...prev.tests, trimmed],
      }));
    }
    setCurrentTestInput("");
  };

  const handleRemoveTest = (idx) => {
    setFormData((prev) => ({
      ...prev,
      tests: prev.tests.filter((_, i) => i !== idx),
    }));
  };

  // Nested Vital Signs Handler
  const handleVitalChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [name]: value,
      },
    }));
  };

  // Allergy Handlers
  const handleAddAllergy = (e) => {
    if (e) e.preventDefault();
    const trimmed = currentAllergyInput.trim();

    if (!trimmed || formData.allergiesList.includes(trimmed)) return;

    const updatedList = [...formData.allergiesList, trimmed];
    setFormData((prev) => ({
      ...prev,
      hasAllergies: true,
      allergiesList: updatedList,
      allergies: updatedList.join(", "),
    }));
    setCurrentAllergyInput("");
  };

  const handleRemoveAllergy = (indexToRemove) => {
    const updatedList = formData.allergiesList.filter((_, idx) => idx !== indexToRemove);
    setFormData((prev) => ({
      ...prev,
      hasAllergies: updatedList.length > 0,
      allergiesList: updatedList,
      allergies: updatedList.join(", "),
    }));
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formData.chiefComplaint.trim()) {
      setError("Chief complaint is required.");
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      allergies: formData.hasAllergies ? formData.allergies : "",
      patientHistory: formData.hasHistory ? formData.patientHistory : null,
      familyHistory: formData.hasHistory ? formData.familyHistory : null,
      socialHistory: formData.hasSocialHistory ? formData.socialHistory : null,
      followUpDate: formData.followUpDate || null,
    };

    try {
      const response = await api.post("/clinic/consultation", payload);

      if (response.status === 200 || response.status === 201) {
        setSuccessMsg("Consultation recorded successfully!");
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "An error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="text-blue-600" size={24} />
            Clinical Consultation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Appointment ID: <span className="font-mono text-slate-700">{formData.appointmentId || "N/A"}</span>
            {patientName && ` | Patient: ${patientName}`}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700">
          <UserCheck size={14} /> Attending: Dr. {formData.doctor}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <ShieldAlert size={18} />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Vital Signs */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity size={16} className="text-emerald-500" />
            Triage & Vital Signs
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">BP (mmHg)</label>
              <input
                type="text"
                name="bloodPressure"
                placeholder="120/80"
                value={formData.vitalSigns.bloodPressure}
                onChange={handleVitalChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Thermometer size={12} className="text-red-500" /> Temp (°C)
              </label>
              <input
                type="text"
                name="temperature"
                placeholder="36.8"
                value={formData.vitalSigns.temperature}
                onChange={handleVitalChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className=" text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Heart size={12} className="text-pink-500" /> Pulse (bpm)
              </label>
              <input
                type="text"
                name="pulse"
                placeholder="72"
                value={formData.vitalSigns.pulse}
                onChange={handleVitalChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className=" text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Wind size={12} className="text-blue-500" /> Resp Rate
              </label>
              <input
                type="text"
                name="respiratoryRate"
                placeholder="18"
                value={formData.vitalSigns.respiratoryRate}
                onChange={handleVitalChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">SpO2 (%)</label>
              <input
                type="text"
                name="oxygenSaturation"
                placeholder="98"
                value={formData.vitalSigns.oxygenSaturation}
                onChange={handleVitalChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pain (0-10)</label>
              <select
                name="painLevel"
                value={formData.vitalSigns.painLevel}
                onChange={handleVitalChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {[...Array(11).keys()].map((n) => (
                  <option key={n} value={n.toString()}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Allergies & Medical History */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Allergies & Patient History
          </h3>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="hasAllergies"
                  checked={formData.hasAllergies}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData((prev) => ({
                      ...prev,
                      hasAllergies: checked,
                      allergiesList: checked ? prev.allergiesList : [],
                      allergies: checked ? prev.allergies : "",
                    }));
                  }}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                Known Patient Allergies
              </label>
            </div>

            {formData.hasAllergies && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Penicillin, Peanuts, Latex"
                    value={currentAllergyInput}
                    onChange={(e) => setCurrentAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAllergy(e);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddAllergy}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                {/* Tags List */}
                <div className="flex flex-wrap gap-2">
                  {formData.allergiesList.map((allergy, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-medium border border-amber-200"
                    >
                      {allergy}
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(idx)}
                        className="text-amber-700 hover:text-amber-950"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="hasHistory"
                  checked={formData.hasHistory}
                  onChange={handleChange}
                  className="rounded border-slate-300 text-blue-600"
                />
                Include Past Medical & Family History
              </label>
              {formData.hasHistory && (
                <div className="space-y-2">
                  <textarea
                    name="patientHistory"
                    rows={2}
                    placeholder="Patient Medical History..."
                    value={formData.patientHistory}
                    onChange={handleChange}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <textarea
                    name="familyHistory"
                    rows={2}
                    placeholder="Family Medical History..."
                    value={formData.familyHistory}
                    onChange={handleChange}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="hasSocialHistory"
                  checked={formData.hasSocialHistory}
                  onChange={handleChange}
                  className="rounded border-slate-300 text-blue-600"
                />
                Include Social History
              </label>
              {formData.hasSocialHistory && (
                <textarea
                  name="socialHistory"
                  rows={4}
                  placeholder="Smoking, Alcohol intake, Occupation, Lifestyle..."
                  value={formData.socialHistory}
                  onChange={handleChange}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Clinical Evaluation */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            Clinical Notes & Examination
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chief Complaint <span className="text-red-500">*</span>
              </label>
              <textarea
                name="chiefComplaint"
                rows={2}
                placeholder="e.g. Nausea, headache"
                value={formData.chiefComplaint}
                onChange={handleChange}
                required
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Symptoms</label>
              <textarea
                name="associatedSymptoms"
                rows={2}
                placeholder="Fever, chills, vomiting..."
                value={formData.associatedSymptoms}
                onChange={handleChange}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Onset</label>
              <input
                type="text"
                name="onset"
                placeholder="2 days ago"
                value={formData.onset}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duration</label>
              <input
                type="text"
                name="duration"
                placeholder="Persistent"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Severity</label>
              <input
                type="text"
                name="severity"
                placeholder="Moderate"
                value={formData.severity}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Review of Systems</label>
              <textarea
                name="reviewOfSystems"
                rows={2}
                placeholder="Review findings..."
                value={formData.reviewOfSystems}
                onChange={handleChange}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Examination</label>
              <textarea
                name="physicalExam"
                rows={2}
                placeholder="Physical examination notes..."
                value={formData.physicalExam}
                onChange={handleChange}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FlaskConical size={14} className="text-purple-600" /> Lab Tests / Document IDs
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter test code / ID..."
                value={currentTestInput}
                onChange={(e) => setCurrentTestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTest(e)}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={handleAddTest}
                className="px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-900 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {formData.tests.map((testId, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs border border-slate-200 font-mono"
                >
                  {testId}
                  <button
                    type="button"
                    onClick={() => handleRemoveTest(idx)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-5 py-2 rounded-lg text-xs shadow-sm transition-all"
          >
            <Save size={15} />
            {loading ? "Saving Record..." : "Save Consultation"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConsultationForm;