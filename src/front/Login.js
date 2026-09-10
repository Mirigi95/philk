import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { Eye, EyeOff, Loader2, ShieldCheck, ArrowLeft, Activity, HeartPulse, UserCheck } from "lucide-react";
import { auth } from "../fb/init";
import api from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  // Helper function to process backend verification
  const processServerAuth = async (token) => {
    sessionStorage.setItem("token", token);

    // Pass token explicitly in Authorization header
    const res = await api.post(
      "/auth",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { role, clientId, user } = res.data;

    // Persist user context
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("clientId", clientId);
    sessionStorage.setItem("userName", user?.name || user?.fullName || "User");

    // Route based on role
    window.location.href = role === "Admin" ? "/admin" : "/dashboard";
  };

  // --- Auth Logic ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("All fields are required");
      return;
    }
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();
      await processServerAuth(token);
    } catch (err) {
      console.error("Login Error:", err);
      setError(
        err.response?.data?.message || "Invalid email or password"
      );
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      await processServerAuth(token);
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError("Google Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Reset link sent! Check your inbox.");
      setTimeout(() => setIsResetMode(false), 3000);
    } catch (err) {
      console.error("Reset Error:", err);
      setError("Failed to send reset email. Verify your address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* LEFT SIDE: Branding Panel */}
      <div className="hidden md:flex md:w-1/2 bg-blue-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-600 opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-blue-800 opacity-50 pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
            <HeartPulse className="w-8 h-8 text-blue-200" />
          </div>
          <span className="text-2xl font-bold tracking-tight">PhilCare Clinic</span>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4">
            Streamlined Healthcare Management System
          </h1>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Manage patient records, schedule appointments, and coordinate care effortlessly through our unified clinical workspace.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-lg backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-blue-200 shrink-0" />
              <span className="text-sm text-blue-50 font-medium">HIPAA-compliant data encryption & storage</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-lg backdrop-blur-sm">
              <Activity className="w-5 h-5 text-blue-200 shrink-0" />
              <span className="text-sm text-blue-50 font-medium">Real-time clinical workflow tracking</span>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-lg backdrop-blur-sm">
              <UserCheck className="w-5 h-5 text-blue-200 shrink-0" />
              <span className="text-sm text-blue-50 font-medium">Role-based access for staff & practitioners</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-blue-200">
          © {new Date().getFullYear()} PhilCare Clinic Management System. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Login / Reset Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Header Branding */}
          <div className="md:hidden flex flex-col items-center mb-6">
            <div className="bg-blue-600 p-3 rounded-2xl mb-2 text-white">
              <HeartPulse className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">PhilCare Clinic</h2>
            <p className="text-xs text-slate-500">Healthcare Management Portal</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {isResetMode ? "Reset Password" : "Welcome Back"}
              </h2>
              <p className="text-slate-500 mt-1 text-sm">
                {isResetMode 
                  ? "Enter your email to receive a recovery link" 
                  : "Access your clinic administration portal"}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-5 p-3.5 bg-green-50 border-l-4 border-green-500 text-green-700 text-sm rounded-r-lg">
                {message}
              </div>
            )}

            {!isResetMode ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="doctor@philcareclinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setIsResetMode(true)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-slate-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Sign In to Portal"}
                </button>
              </form>
            ) : (
              /* RESET FORM */
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Recovery Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter registered clinic email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800 placeholder-slate-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Send Reset Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="w-full flex items-center justify-center gap-2 text-slate-500 text-sm hover:text-slate-800 transition-colors pt-2"
                >
                  <ArrowLeft size={16} /> Back to Login
                </button>
              </form>
            )}

            {!isResetMode && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="px-3 bg-white text-slate-400 font-medium">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 py-3 rounded-lg hover:bg-slate-50 transition-all shadow-sm font-medium text-sm disabled:opacity-60"
                >
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    className="w-5 h-5" 
                  />
                  Sign in with Google
                </button>
              </>
            )}

            <p className="text-center mt-6 text-sm text-slate-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
                Create Account
              </Link>
            </p>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Clinic Support:{" "}
                <a href="mailto:support@philcareclinic.com" className="text-blue-600 hover:underline font-medium">
                  support@philcareclinic.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;