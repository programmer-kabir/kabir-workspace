import { useState, useEffect, useRef } from "react";
import { FaGoogle, FaEnvelope, FaLock, FaUser, FaArrowLeft, FaKey, FaCheckCircle, FaShieldAlt, FaBolt, FaLayerGroup } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "../../utlis/Hooks/useAuth";
import { forgotPasswordApi, resetPasswordApi } from "../../api/api";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import DayalLoader from "../../components/Common/DayalLoader";
import PikSeaLogo from "../../components/Common/PikSeaLogo";

const Login = () => {
  const navigate = useNavigate();
  const { SingInUser, RegisterUser, VerifyOtp, ResendOtp, GoogleLogin } = useAuth();

  // Modes: 'signin' | 'signup' | 'otp' | 'forgot' | 'reset'
  const [mode, setMode] = useState("signin");

  // Form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpType, setOtpType] = useState("registration"); // 'registration' | 'password_reset'
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputsRef = useRef([]);

  // Reset password state
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Please wait...");

  // Countdown timer for OTP
  useEffect(() => {
    let interval = null;
    if (mode === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timer]);

  // Focus first OTP input when switching to OTP mode
  useEffect(() => {
    if (mode === "otp") {
      setTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    }
  }, [mode]);

  // Google 1-Click Login
  const handleGoogleLogin = async () => {
    setLoadingMessage("Connecting to Google Account...");
    setIsSubmitting(true);
    try {
      const res = await GoogleLogin();
      if (res.success) {
        toast.success(`Welcome back, ${res.user?.name || "Creator"}!`);
        navigate("/");
      } else {
        toast.error(res.message || "Google login failed");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Google Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign In
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Please enter your email and password");
      return;
    }
    setLoadingMessage("Authenticating your credentials...");
    setIsSubmitting(true);
    try {
      const res = await SingInUser(email, password);
      if (res.success) {
        toast.success(`Welcome back, ${res.user?.name || "Creator"}!`);
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      if (error.needs_verification) {
        toast.info("Please verify your email address to continue.");
        setOtpType("registration");
        setMode("otp");
      } else {
        toast.error(error.message || "Invalid email or password");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Please enter your full name");
      return;
    }
    if (!email.trim()) {
      toast.warning("Please enter a valid email");
      return;
    }
    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters long");
      return;
    }

    setLoadingMessage("Creating account & sending 6-digit code...");
    setIsSubmitting(true);
    try {
      const res = await RegisterUser(name.trim(), email.trim(), password);
      if (res.success) {
        toast.success("Verification code sent to your email!");
        setOtpType("registration");
        setMode("otp");
      } else {
        toast.error(res.message || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP Handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.warning("Please enter all 6 digits");
      return;
    }

    setLoadingMessage("Verifying security code & credentials...");
    setIsSubmitting(true);
    try {
      const res = await VerifyOtp(email, code, otpType);
      if (res.success) {
        if (otpType === "registration") {
          toast.success("Email verified successfully! Welcome to PikSea.");
          navigate("/");
        } else if (otpType === "password_reset") {
          toast.success("Code verified! Set your new password.");
          setMode("reset");
        }
      } else {
        toast.error(res.message || "Invalid verification code");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoadingMessage("Generating a fresh 6-digit OTP...");
    setIsSubmitting(true);
    try {
      const res = await ResendOtp(email, otpType);
      if (res.success) {
        toast.success("A new verification code has been sent!");
        setTimer(60);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        otpInputsRef.current[0]?.focus();
      } else {
        toast.error(res.message || "Failed to resend code");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error resending code");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot Password Request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.warning("Please enter your registered email");
      return;
    }

    setLoadingMessage("Sending password reset code to your inbox...");
    setIsSubmitting(true);
    try {
      const res = await forgotPasswordApi({ email });
      if (res.success) {
        toast.success("Password reset code sent to your email!");
        setOtpType("password_reset");
        setMode("otp");
      } else {
        toast.error(res.message || "Failed to send reset code");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error sending reset code");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Password Submission
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (newPassword.length < 6) {
      toast.warning("Password must be at least 6 characters long");
      return;
    }

    setLoadingMessage("Updating your password & signing in...");
    setIsSubmitting(true);
    try {
      const res = await resetPasswordApi({ email, code, new_password: newPassword });
      if (res.success) {
        toast.success("Password reset successful! You are now logged in.");
        navigate("/");
      } else {
        toast.error(res.message || "Failed to reset password");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#030303] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-inter transition-colors duration-300">

      {/* Background Ambient Mesh Light Spheres */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-[#0284C7]/20 via-[#00D4FF]/10 to-transparent rounded-full filter blur-[140px] pointer-events-none opacity-80 dark:opacity-40 animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-[#00D4FF]/20 via-[#8B5CF6]/15 to-transparent rounded-full filter blur-[140px] pointer-events-none opacity-80 dark:opacity-40" style={{ animationDelay: '3s' }} />

      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-5xl w-full mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

        {/* ============================================================ */}
        {/* LEFT COLUMN: BRAND & CREATIVE HIGHLIGHTS (Visible on lg+) */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 xl:p-10 space-y-8"
        >
          {/* Logo & Headline */}
          <div>
            <PikSeaLogo size="lg" />

            <h2 className="mt-8 text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-[1.2] font-outfit">
              Capture The World in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0284C7] via-[#06B6D4] to-[#38BDF8]">
                Breathtaking Detail
              </span>
            </h2>
            <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Unlock access to millions of curated, high-resolution stock photos captured by visionary photographers worldwide.
            </p>
          </div>

          {/* Floating Feature Badges */}
          <div className="space-y-4">
            <motion.div
              whileHover={{ x: 6 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-[#0284C7] flex items-center justify-center shrink-0">
                <FaBolt size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white font-outfit">Instant Full-Res Downloads</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">High-speed CDN delivery of 4K, 8K & RAW photos</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ x: 6 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-[#06B6D4] flex items-center justify-center shrink-0">
                <FaLayerGroup size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white font-outfit">Handpicked Photography</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Authentic moments, diverse portraits, and stunning landscapes</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ x: 6 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <FaShieldAlt size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white font-outfit">Commercial License Included</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Worry-free usage for commercial & editorial projects</p>
              </div>
            </motion.div>
          </div>

          {/* Social Proof */}
          <div className="pt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
            <div className="flex -space-x-2">
              {['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces',
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces',
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces'
              ].map((src, i) => (
                <img key={i} src={src} alt="user" className="w-8 h-8 rounded-full border-2 border-white dark:border-[#111] object-cover" />
              ))}
            </div>
            <span>Trusted by <strong className="text-gray-900 dark:text-white font-bold">50,000+</strong> global creatives</span>
          </div>
        </motion.div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: AUTHENTICATION CARD */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-6 w-full max-w-[460px] mx-auto"
        >
          {/* Mobile Header Logo */}
          <div className="lg:hidden flex justify-center mb-6 text-center">
            <PikSeaLogo size="md" />
          </div>

          {/* Premium Glass Card */}
          <div className="relative rounded-[28px] p-1 bg-gradient-to-b from-gray-200/80 via-gray-100/50 to-transparent dark:from-white/15 dark:via-white/5 dark:to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-3xl">
            <div className="bg-white/95 dark:bg-[#0B0B0C]/90 rounded-[26px] p-6 sm:p-9 relative overflow-hidden min-h-[480px]">

              {/* Ultra-Premium In-Card Frosted Loader Overlay */}
              <AnimatePresence>
                {isSubmitting && (
                  <DayalLoader isOverlay={true} text={loadingMessage} />
                )}
              </AnimatePresence>

              {/* Top Card Ambient Gradient Line */}
              <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-80" />

              <AnimatePresence mode="wait">

                {/* ──────────────────────────────────────────────────────────── */}
                {/* 1. SIGN IN & SIGN UP SCREENS */}
                {/* ──────────────────────────────────────────────────────────── */}
                {(mode === "signin" || mode === "signup") && (
                  <motion.div
                    key={mode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Header */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-outfit tracking-tight">
                        {mode === "signin" ? "Welcome Back" : "Join PikSea"}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {mode === "signin"
                          ? "Sign in to access your saved downloads & collections"
                          : "Create an account with instant 6-digit email verification"}
                      </p>
                    </div>

                    {/* Animated Tab Switcher */}
                    <div className="flex p-1 bg-gray-100 dark:bg-white/[0.06] rounded-2xl mb-6 relative border border-gray-200/60 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => setMode("signin")}
                        className={`relative flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 z-10 ${mode === "signin"
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          }`}
                      >
                        {mode === "signin" && (
                          <motion.div
                            layoutId="activeAuthTab"
                            className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl shadow-sm -z-10"
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          />
                        )}
                        Sign In
                      </button>

                      <button
                        type="button"
                        onClick={() => setMode("signup")}
                        className={`relative flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 z-10 ${mode === "signup"
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          }`}
                      >
                        {mode === "signup" && (
                          <motion.div
                            layoutId="activeAuthTab"
                            className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl shadow-sm -z-10"
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                          />
                        )}
                        Create Account
                      </button>
                    </div>

                    {/* Google 1-Click Button */}
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isSubmitting}
                      className="w-full flex justify-center items-center gap-3 h-12 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] px-4 text-sm font-semibold text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm hover:shadow"
                    >
                      <div className="bg-white p-1.5 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                        <FaGoogle className="text-[#DB4437]" size={14} />
                      </div>
                      <span>Continue with Google</span>
                    </button>

                    {/* Divider */}
                    <div className="relative my-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                        <span className="bg-white dark:bg-[#0B0B0C] px-3 text-gray-400 font-semibold">
                          or continue with email
                        </span>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
                      {mode === "signup" && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            Full Name
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                              <FaUser size={13} />
                            </div>
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="John Doe"
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff7900]/40 focus:border-[#ff7900] transition-all"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                          Email Address
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
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff7900]/40 focus:border-[#ff7900] transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                            Password
                          </label>
                          {mode === "signin" && (
                            <button
                              type="button"
                              onClick={() => setMode("forgot")}
                              className="text-xs font-bold text-[#ff7900] hover:underline"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
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
                            className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff7900]/40 focus:border-[#ff7900] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Primary Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-2 h-12 rounded-2xl bg-gradient-to-r from-[#ff7900] via-[#ff8800] to-[#ff9900] text-white font-bold text-sm shadow-[0_6px_20px_rgba(255,121,0,0.35)] hover:shadow-[0_8px_25px_rgba(255,121,0,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>{mode === "signin" ? "Sign In to Account" : "Create Account & Verify"}</span>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ──────────────────────────────────────────────────────────── */}
                {/* 2. 6-DIGIT OTP VERIFICATION SCREEN */}
                {/* ──────────────────────────────────────────────────────────── */}
                {mode === "otp" && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="text-center py-2"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-[#ff7900]/20 to-[#ff9400]/10 text-[#ff7900] flex items-center justify-center shadow-inner border border-[#ff7900]/20">
                      <FaKey size={26} />
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-outfit tracking-tight">
                      Security Verification
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Enter the 6-digit code sent to <br />
                      <strong className="text-gray-800 dark:text-gray-200 font-bold">{email}</strong>
                    </p>

                    <form onSubmit={handleVerifyOtp} className="mt-6">
                      {/* 6 Auto-Advancing Digit Inputs */}
                      <div className="flex justify-center gap-2 sm:gap-2.5 mb-6" onPaste={handleOtpPaste}>
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => (otpInputsRef.current[idx] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-black rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#ff7900] focus:border-transparent transition-all shadow-inner"
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || otp.join("").length !== 6}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#ff7900] via-[#ff8800] to-[#ff9900] text-white font-bold text-sm shadow-[0_6px_20px_rgba(255,121,0,0.35)] hover:shadow-[0_8px_25px_rgba(255,121,0,0.45)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>Verify & Proceed</span>
                        )}
                      </button>
                    </form>

                    {/* Resend Cooldown Timer & Action */}
                    <div className="mt-6 flex flex-col items-center gap-2">
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isSubmitting}
                          className="text-xs font-bold text-[#ff7900] hover:underline"
                        >
                          Didn't receive code? Resend Code
                        </button>
                      ) : (
                        <p className="text-xs text-gray-400">
                          Resend available in <strong className="text-gray-700 dark:text-gray-200 font-bold">{timer}s</strong>
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => setMode(otpType === "registration" ? "signup" : "signin")}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mt-2 font-medium"
                      >
                        <FaArrowLeft size={11} />
                        <span>Use a different email address</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ──────────────────────────────────────────────────────────── */}
                {/* 3. FORGOT PASSWORD (EMAIL INPUT) */}
                {/* ──────────────────────────────────────────────────────────── */}
                {mode === "forgot" && (
                  <motion.div
                    key="forgot"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-outfit tracking-tight">
                        Reset Password
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Enter your email and we'll send a 6-digit recovery code.
                      </p>
                    </div>

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                          Registered Email
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
                            placeholder="you@example.com"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff7900]/40 focus:border-[#ff7900] transition-all"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#ff7900] via-[#ff8800] to-[#ff9900] text-white font-bold text-sm shadow-[0_6px_20px_rgba(255,121,0,0.35)] hover:shadow-[0_8px_25px_rgba(255,121,0,0.45)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>Send Recovery Code</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setMode("signin")}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white pt-2"
                      >
                        <FaArrowLeft size={11} />
                        <span>Back to Sign In</span>
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* ──────────────────────────────────────────────────────────── */}
                {/* 4. SET NEW PASSWORD */}
                {/* ──────────────────────────────────────────────────────────── */}
                {mode === "reset" && (
                  <motion.div
                    key="reset"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="py-2"
                  >
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                        <FaCheckCircle size={26} />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-outfit tracking-tight">
                        Create New Password
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Enter your new secure password below.
                      </p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                            <FaLock size={13} />
                          </div>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff7900]/40 focus:border-[#ff7900] transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                          >
                            {showNewPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#ff7900] via-[#ff8800] to-[#ff9900] text-white font-bold text-sm shadow-[0_6px_20px_rgba(255,121,0,0.35)] hover:shadow-[0_8px_25px_rgba(255,121,0,0.45)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span>Update Password & Sign In</span>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Terms Footer */}
              <p className="mt-8 text-[11px] text-center text-gray-400 dark:text-gray-500 leading-relaxed">
                By continuing, you agree to PikSea's{" "}
                <Link to="/terms-of-use" className="text-[#0284C7] hover:underline font-bold">Terms of Service</Link> &{" "}
                <Link to="/privacy-policy" className="text-[#0284C7] hover:underline font-bold">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Login;