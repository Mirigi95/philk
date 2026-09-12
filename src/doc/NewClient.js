import React, { useState } from "react";
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Activity, 
  Heart, 
  Thermometer, 
  Wind, 
  Save, 
  ArrowLeft,
  FileText,
  ShieldAlert
} from "lucide-react";
import api from "../services/api";

const NewClient = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    clientId: "",
    fullName: "",
    idNo: "",
    phone: "",
    address: "",
    dob: "",
    age: "",
    bloodPressure: "",
    oxygenSaturation: "",
    painLevel: "0",
    pulse: "",
    respiratoryRate: "",
    temperature: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-calculate age if DOB changes
    if (name === "dob" && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setFormData((prev) => ({
        ...prev,
        dob: value,
        age: calculatedAge >= 0 ? calculatedAge.toString() : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formData.clientId || !formData.fullName || !formData.idNo) {
      setError("Client ID, Full Name, and ID Number are required.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      // FIXED: Proper Axios signature: api.post(url, payload, config)
      
      const response = await api.post(
        "/clinic/clients", 
        formData, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Axios automatically parses JSON into response.data
      const result = response.data;

      setSuccessMsg("Client record saved successfully!");
      if (onSuccess) onSuccess(result.client || result);
      
      // Reset form
      setFormData({
        clientId: "",
        fullName: "",
        idNo: "",
        phone: "",
        address: "",
        dob: "",
        age: "",
        bloodPressure: "",
        oxygenSaturation: "",
        painLevel: "0",
        pulse: "",
        respiratoryRate: "",
        temperature: "",
      });
    } catch (err) {
      // Handle standard Axios error structure
      const message = err.response?.data?.message || err.message || "Failed to create client";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="text-blue-600" size={22} />
            Add New Client
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Register a new patient and record initial vital signs
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 px-3 py-2 rounded-lg"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <ShieldAlert size={18} />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: Personal Information */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText size={16} className="text-slate-400" />
            Personal Identification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Client ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="clientId"
                placeholder="e.g. PHIL/25/004"
                value={formData.clientId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                placeholder="e.g. PHILEMON NYAKUNDI"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                National ID / Passport <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="idNo"
                placeholder="e.g. 36714489"
                value={formData.idNo}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="0740875749"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Address / Location
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. KISII EST"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Age
              </label>
              <input
                type="text"
                name="age"
                placeholder="26"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Initial Vital Signs */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity size={16} className="text-emerald-500" />
            Triage & Vital Signs
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Blood Pressure
              </label>
              <input
                type="text"
                name="bloodPressure"
                placeholder="114/98"
                value={formData.bloodPressure}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Thermometer size={12} className="text-red-500" /> Temp (°C)
              </label>
              <input
                type="text"
                name="temperature"
                placeholder="39"
                value={formData.temperature}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Heart size={12} className="text-pink-500" /> Pulse (bpm)
              </label>
              <input
                type="text"
                name="pulse"
                placeholder="98"
                value={formData.pulse}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Wind size={12} className="text-blue-500" /> Resp Rate
              </label>
              <input
                type="text"
                name="respiratoryRate"
                placeholder="28"
                value={formData.respiratoryRate}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                SpO2 (%)
              </label>
              <input
                type="text"
                name="oxygenSaturation"
                placeholder="92"
                value={formData.oxygenSaturation}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Pain Level (0-10)
              </label>
              <select
                name="painLevel"
                value={formData.painLevel}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {[...Array(11).keys()].map((num) => (
                  <option key={num} value={num.toString()}>
                    {num} {num === 0 ? "(No Pain)" : num === 10 ? "(Worst Pain)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-6 py-2.5 rounded-lg text-sm shadow-sm transition-all"
          >
            <Save size={16} />
            {loading ? "Saving Record..." : "Save Client Record"}
          </button>
        </div>
      </form>
    </div>
  );
};

export { NewClient };