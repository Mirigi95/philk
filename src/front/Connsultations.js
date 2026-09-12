import React, { useState } from "react";
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  FileText,
  Save,
  Plus,
  X,
  Clock,
  Heart,
  Thermometer,
  Wind,
  ShieldAlert,
  UserCheck
} from "lucide-react";

const ConsultationForm = ({ appointmentId = "", patientName = "", onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    appointmentId: appointmentId || "59SsG61hULxspdDa3xBo",
    doctor: "dan",
    chiefComplaint: "",
    associatedSymptoms: "",
    onset: "",
    duration: "",
    severity: "",
    treatmentTried: "",
    historyOfIllness: "",
    reviewOfSystems: "",
    physicalExam: "",
    assessment: "",
    diagnosisCode: "",
    plan: "",
    medications: "",
    notes: "",
    followUpDate: null,
    
    // History Flags & Fields
    hasAllergies: false,
    allergiesList: [], // Local state array for individual allergy tags
    allergies: "",     // Serialized string representation
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Handle Standard Direct Fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle Nested Vital Signs
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

  // Allergy Tag Handlers
  const handleAddAllergy = (e) => {
    e.preventDefault();
    if (!currentAllergyInput.trim()) return;

    const updatedList = [...formData.allergiesList, currentAllergyInput.trim()];
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

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formData.chiefComplaint) {
      setError("Chief complaint is required.");
      return;
    }

    setLoading(true);

    // Payload formatted to match your exact backend structure
    const payload = {
      appointmentId: formData.appointmentId,
      doctor: formData.doctor,
      chiefComplaint: formData.chiefComplaint,
      associatedSymptoms: formData.associatedSymptoms,
      onset: formData.onset,
      duration: formData.duration,
      severity: formData.severity,
      treatmentTried: formData.treatmentTried,
      historyOfIllness: formData.historyOfIllness,
      reviewOfSystems: formData.reviewOfSystems,
      physicalExam: formData.physicalExam,
      assessment: formData.assessment,
      diagnosisCode: formData.diagnosisCode,
      plan: formData.plan,
      medications: formData.medications,
      notes: formData.notes,
      followUpDate: formData.followUpDate,
      hasAllergies: formData.hasAllergies,
      allergies: formData.allergies,
      hasHistory: formData.hasHistory,
      patientHistory: formData.hasHistory ? formData.patientHistory : "null",
      familyHistory: formData.hasHistory ? formData.familyHistory : "null",
      hasSocialHistory: formData.hasSocialHistory,
      socialHistory: formData.socialHistory,
      vitalSigns: formData.vitalSigns,
    };

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to record consultation");
      }

      setSuccessMsg("Consultation recorded successfully!");
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err.message);
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
            Appointment ID: <span className="font-mono text-slate-700">{formData.appointmentId}</span>
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
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
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
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
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
                  <option key={n} value={n.toString()}>{n}</option>
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
                    onKeyDown={(e) => e.key === "Enter" && handleAddAllergy(e)}
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
                    value={formData.patientHistory === "null" ? "" : formData.patientHistory}
                    onChange={handleChange}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <textarea
                    name="familyHistory"
                    rows={2}
                    placeholder="Family Medical History..."
                    value={formData.familyHistory === "null" ? "" : formData.familyHistory}
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Treatment Tried</label>
              <input
                type="text"
                name="treatmentTried"
                placeholder="Paracetamol"
                value={formData.treatmentTried}
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
        </div>

        {/* SECTION 4: Diagnosis & Plan */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Diagnosis & Treatment Plan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosis Code / Condition</label>
              <input
                type="text"
                name="diagnosisCode"
                placeholder="e.g. Malaria, Acute Gastritis"
                value={formData.diagnosisCode}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold text-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock size={13} className="text-slate-400" /> Follow-Up Date
              </label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prescribed Medications</label>
              <textarea
                name="medications"
                rows={3}
                placeholder="List prescribed medicines and dosages..."
                value={formData.medications}
                onChange={handleChange}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Plan & Additional Notes</label>
              <textarea
                name="plan"
                rows={3}
                placeholder="Management plan, lab tests, advice..."
                value={formData.plan}
                onChange={handleChange}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"
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