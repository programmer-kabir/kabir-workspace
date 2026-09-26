import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { motion } from "framer-motion";
import useAuth from "../../utlis/Hooks/useAuth";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const { GoogleLogin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const result = await GoogleLogin();
      const user = result.user;
      const token = await user.getIdToken();

      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/internal-auth/google_login.php`,
        {
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        toast.success(`Welcome back ${user.displayName || ""}`);
        navigate("/");
      } else {
        toast.error(res.data.message || "Login failed on server");
      }
    } catch (error) {
      console.error(error);
      toast.error("Google Login Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-inter">
      {/* Background Ambience */}
      <div className="absolute top-[-15%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="sm:mx-auto w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex justify-center"
        >
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#ff7900] to-[#ffaa00] drop-shadow-md">
            Dayal Stock
          </h1>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#111111]/80 backdrop-blur-xl py-10 px-6 shadow-2xl rounded-3xl sm:px-12 border border-white/10 relative overflow-hidden"
        >
          {/* Inner ambient glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#ff7900] rounded-full filter blur-[80px] opacity-10" />

          <div className="text-center mb-10 relative z-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Welcome Back
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              Sign in to continue to your creative journey
            </p>
          </div>

          {/* Social Login */}
          <div className="mt-6 relative z-10">
            <button 
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="group w-full flex justify-center items-center gap-3 h-14 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-base font-semibold text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#ff7900]/50 focus:ring-offset-2 focus:ring-offset-[#111] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-gray-400 border-t-[#ff7900] rounded-full animate-spin"></div>
              ) : (
                <>
                  <div className="bg-white p-1.5 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                    <FaGoogle className="text-[#DB4437]" size={16} />
                  </div>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Terms */}
          <p className="mt-10 text-xs text-center text-gray-500 leading-relaxed relative z-10">
            By continuing, you agree to Dayal Stock's <a href="#" className="text-[#ff7900] hover:underline">Terms of Service</a> and <a href="#" className="text-[#ff7900] hover:underline">Privacy Policy</a>. 
            <br className="hidden sm:block" /> This site is protected by reCAPTCHA.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;