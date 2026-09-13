import React, { useState, useEffect } from "react";
import {
  Pill,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  Calendar,
  Activity,
  User,
  FlaskConical,
} from "lucide-react";
import api from "../services/api";

// Helper to format Date strings / Firestore timestamps to YYYY-MM-DD for HTML date inputs
const formatDateForInput = (dateVal) => {
  if (!dateVal) return "";
  if (typeof dateVal === "string") return dateVal.split("T")[0];
  if (dateVal instanceof Date) return dateVal.toISOString().split("T")[0];
  if (typeof dateVal === "object" && dateVal?.seconds) {
    return new Date(dateVal.seconds * 1000).toISOString().split("T")[0];
  }
  return "";
};

const TreatmentForm = ({
  selectedConsultation = null,
  onSuccess,
  onCancel,
}) => {
  // Helper to build default or synchronized state
  const buildInitialState = (data) => ({
    appointmentId: data?.appointmentId || data?.id || "",
    clientId: data?.clientId || "",
    patientId: data?.patientId || "",
    doctorId: data?.doctorId || "",
    doctorEmail: data?.doctorEmail || "doctor@admin.it",
    diagnosisCode: data?.diagnosisCode || "",
    diagnosisNotes: data?.diagnosisNotes || data?.chiefComplaint || "",
    treatment: data?.treatment || "",
    notes: data?.notes || "",
    followUpInterval: String(data?.followUpInterval || "7"),
    followUpDate: formatDateForInput(data?.followUpDate),
    hasAllergies: Boolean(data?.allergiesList?.length || data?.hasAllergies),
    allergiesList: data?.allergiesList || [],
    allergies: data?.allergies || "",
    prescription: data?.prescription?.length
      ? data.prescription
      : [{ medication: "", frequency: "" }],
    tests: data?.tests || [],
    vitalSigns: {
      bloodPressure: data?.vitalSigns?.bloodPressure || "",
      oxygenSaturation: data?.vitalSigns?.oxygenSaturation || "",
      pulse: data?.vitalSigns?.pulse || "",
      respiratoryRate: data?.vitalSigns?.respiratoryRate || "",
      temperature: data?.vitalSigns?.temperature || "",
    },
  });

  const [formData, setFormData] = useState(() => buildInitialState(selectedConsultation));
  const [currentAllergyInput, setCurrentAllergyInput] = useState("");
  const [currentTestInput, setCurrentTestInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Sync state if selectedConsultation changes after mount
  useEffect(() => {
    if (selectedConsultation) {
      setFormData(buildInitialState(selectedConsultation));
    }
  }, [selectedConsultation]);

  // Standard Field Handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Vital Signs Handler (Immutable)
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

  // Prescription Management (Immutable object updating)
  const handlePrescriptionChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      prescription: prev.prescription.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addPrescriptionRow = () => {
    setFormData((prev) => ({
      ...prev,
      prescription: [...prev.prescription, { medication: "", frequency: "" }],
    }));
  };

  const removePrescriptionRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      prescription: prev.prescription.filter((_, i) => i !== index),
    }));
  };

  // Allergy Tags Management
  const handleAddAllergy = (e) => {
    if (e) e.preventDefault();
    const trimmed = currentAllergyInput.trim();
    if (!trimmed) return;

    if (!formData.allergiesList.includes(trimmed)) {
      const updatedList = [...formData.allergiesList, trimmed];
      setFormData((prev) => ({
        ...prev,
        hasAllergies: true,
        allergiesList: updatedList,
        allergies: updatedList.join(", "),
      }));
    }
    setCurrentAllergyInput("");
  };

  const handleRemoveAllergy = (idx) => {
    const updatedList = formData.allergiesList.filter((_, i) => i !== idx);
    setFormData((prev) => ({
      ...prev,
      hasAllergies: updatedList.length > 0,
      allergiesList: updatedList,
      allergies: updatedList.join(", "),
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

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Clean payload of empty prescription rows
    const cleanPrescription = formData.prescription.filter(
      (item) => item.medication.trim() !== "" || item.frequency.trim() !== ""
    );

    const payload = {
      ...formData,
      prescription: cleanPrescription,
      followUpInterval: Number(formData.followUpInterval) || 0,
    };

    try {
      const response = await api.post("/clinic/treatment", payload);
      setMessage({ type: "success", text: "Treatment plan saved successfully!" });
      if (onSuccess) onSuccess(response.data);
    } catch (err) {
      const errorPayload = err.response?.data?.error || err.response?.data?.message || err.message;
      const errorMsg =
        typeof errorPayload === "object" && errorPayload !== null
          ? errorPayload.message || JSON.stringify(errorPayload)
          : String(errorPayload || "Failed to save treatment record.");

      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Pill className="text-blue-600" size={24} />
            Treatment & Prescription
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Patient ID: <span className="font-mono text-slate-700">{formData.clientId}</span> | 
            Appt: <span className="font-mono text-slate-700">{formData.appointmentId}</span>
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="flex items-center gap-1 font-medium text-slate-700">
            <User size={13} /> {formData.doctorEmail}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message.text && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Allergy Warning Alert */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
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
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <AlertTriangle size={15} className="text-amber-600" />
              Patient Has Known Medication / Drug Allergies
            </label>
          </div>

          {formData.hasAllergies && (
            <div className="space-y-3 pt-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter allergy (e.g., Penicillin, NSAIDs)..."
                  value={currentAllergyInput}
                  onChange={(e) => setCurrentAllergyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAllergy(e)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Tag
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.allergiesList.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-300"
                  >
                    {allergy}
                    <button
                      type="button"
                      onClick={() => handleRemoveAllergy(idx)}
                      className="text-amber-700 hover:text-amber-950"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Diagnosis Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Diagnosis Code</label>
            <input
              type="text"
              name="diagnosisCode"
              value={formData.diagnosisCode}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-blue-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Diagnosis Notes</label>
            <input
              type="text"
              name="diagnosisNotes"
              value={formData.diagnosisNotes}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Prescription Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Pill size={15} className="text-blue-600" />
              Prescribed Medications
            </h3>
            <button
              type="button"
              onClick={addPrescriptionRow}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Plus size={14} /> Add Medication
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="p-3">Medication</th>
                  <th className="p-3">Frequency / Dosage</th>
                  <th className="p-3 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.prescription.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="e.g. Amoxyl"
                        value={item.medication}
                        onChange={(e) => handlePrescriptionChange(idx, "medication", e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        placeholder="e.g. 2/14 or 1 tab x 3 daily"
                        value={item.frequency}
                        onChange={(e) => handlePrescriptionChange(idx, "frequency", e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removePrescriptionRow(idx)}
                        disabled={formData.prescription.length === 1}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Treatment & Lab Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Treatment Procedure</label>
            <input
              type="text"
              name="treatment"
              placeholder="e.g. Injection, IV Fluid, Nebulization"
              value={formData.treatment}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
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
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTest}
                className="px-3 py-2 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-900"
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

        {/* Vitals Summary */}
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity size={15} className="text-emerald-600" /> Vital Signs Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500">BP (mmHg)</label>
              <input
                type="text"
                name="bloodPressure"
                placeholder="120/80"
                value={formData.vitalSigns.bloodPressure}
                onChange={handleVitalChange}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500">Temp (°C)</label>
              <input
                type="text"
                name="temperature"
                placeholder="36.8"
                value={formData.vitalSigns.temperature}
                onChange={handleVitalChange}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500">Pulse (bpm)</label>
              <input
                type="text"
                name="pulse"
                placeholder="72"
                value={formData.vitalSigns.pulse}
                onChange={handleVitalChange}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500">Resp Rate</label>
              <input
                type="text"
                name="respiratoryRate"
                placeholder="18"
                value={formData.vitalSigns.respiratoryRate}
                onChange={handleVitalChange}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500">SpO2 (%)</label>
              <input
                type="text"
                name="oxygenSaturation"
                placeholder="98"
                value={formData.vitalSigns.oxygenSaturation}
                onChange={handleVitalChange}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Follow-up & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar size={14} /> Follow-Up Schedule
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                name="followUpInterval"
                placeholder="Days (e.g. 7)"
                value={formData.followUpInterval}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Clinical Notes</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Treatment notes, patient instructions..."
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Form Actions */}
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
            {loading ? "Saving Treatment..." : "Save Treatment Plan"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TreatmentForm;