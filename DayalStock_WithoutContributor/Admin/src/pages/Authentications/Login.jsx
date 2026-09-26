import { useState, useEffect } from "react";
import { FaGoogle, FaEnvelope, FaLock, FaShieldAlt } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "../../utils/Hooks/useAuth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DayalLoader from "../../components/Common/DayalLoader";

const Login = () => {
  const navigate = useNavigate();
  const { SingInUser, signInWithGoogle, user, userRoles, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Verifying administrator credentials...");

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      const hasAdminRole = (Array.isArray(userRoles) && userRoles.includes("admin")) || 
                           (Array.isArray(user?.roles) && user.roles.includes("admin"));
      if (hasAdminRole) {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, userRoles, authLoading, navigate]);

  // Handle Email & Password Sign In
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Please enter your admin email and password");
      return;
    }

    setLoadingMessage("Verifying administrator credentials...");
    setIsSubmitting(true);
    try {
      const res = await SingInUser(email, password);
      if (res.success) {
        toast.success(`Welcome back, ${res.user?.name || "Administrator"}!`);
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.message || "Invalid administrator credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google 1-Click Login
  const handleGoogleLogin = async () => {
    setLoadingMessage("Connecting to Google Administrator account...");
    setIsSubmitting(true);
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        toast.success(`Welcome back, ${res.user?.name || "Administrator"}!`);
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(error.message || "Google Authentication Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A12] text-gray-100 font-inter">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-15%] left-[-10%] h-[550px] w-[550px] rounded-full bg-[#6C4FE0]/15 blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-10%] h-[550px] w-[550px] rounded-full bg-[#FF6B6B]/10 blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[440px] px-6 py-12"
      >
        <div className="relative rounded-3xl border border-white/10 bg-[#121220]/80 p-8 shadow-2xl backdrop-blur-2xl sm:p-10 overflow-hidden min-h-[460px] flex flex-col justify-center">
          
          {/* Ultra-Premium In-Card Frosted Loader Overlay */}
          <AnimatePresence>
            {isSubmitting && (
              <DayalLoader isOverlay={true} text={loadingMessage} />
            )}
          </AnimatePresence>

          {/* Top Card Gradient Line */}
          <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#6C4FE0] to-transparent opacity-80" />

          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#6C4FE0] via-[#FF6B6B] to-[#ff7900] shadow-[0_4px_20px_rgba(108,79,224,0.4)] mb-4">
              <FaShieldAlt className="text-white text-2xl" />
            </div>
            <h1 className="bg-gradient-to-r from-[#6C4FE0] via-[#FF6B6B] to-[#ff7900] bg-clip-text text-3xl font-black tracking-tight text-transparent">
              Dayal Stock
            </h1>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[#6C4FE0]/20 text-[#A58BFF] text-xs font-semibold tracking-wider uppercase">
              Admin Control Center
            </span>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FaEnvelope size={13} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dayalstock.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6C4FE0] focus:ring-1 focus:ring-[#6C4FE0] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FaLock size={13} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6C4FE0] focus:ring-1 focus:ring-[#6C4FE0] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white"
                >
                  {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 h-12 rounded-xl bg-gradient-to-r from-[#6C4FE0] via-[#7B59F0] to-[#8B5CF6] text-white font-bold text-sm shadow-[0_4px_20px_rgba(108,79,224,0.35)] hover:shadow-[0_6px_25px_rgba(108,79,224,0.5)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Sign In to Admin Panel</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-[#121220] px-3 text-gray-400 font-semibold">
                or authenticate with
              </span>
            </div>
          </div>

          {/* Social Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="group relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/5 font-semibold text-sm text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            <FaGoogle className="text-[#EA4335] transition-transform duration-300 group-hover:scale-110" size={16} />
            <span>Continue with Google</span>
          </button>

          {/* Footer Note */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>🔒 Restricted access for authorized administrators only.</p>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
};

export default Login;