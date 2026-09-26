import { useState, useEffect } from "react";
import { FaGoogle } from "react-icons/fa";
import useAuth from "../../utils/Hooks/useAuth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const { signInWithGoogle, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  // AuthProvider এ admin check শেষ হলে user set হয় — তখন navigate করো
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // navigate এখানে করা হচ্ছে না!
      // AuthProvider onAuthStateChanged এ admin check শেষ হলে
      // উপরের useEffect navigate করবে
    } catch (error) {
      console.error("Login Error:", error);
      const errorMessage = error.message || "Google Authentication Failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0F0F1A]">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#6C4FE0]/15 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#FF6B6B]/10 blur-[120px]" />

      {/* Main Glassmorphism Card */}
      <div className="relative w-full max-w-md px-6 py-12 text-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl md:p-10">
          
          {/* Logo / Branding */}
          <div className="mb-8">
            <h1 className="bg-gradient-to-r from-[#6C4FE0] via-[#FF6B6B] to-[#ff7900] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              Dayal Stock
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Contributor Portal
            </p>
          </div>

          <div className="mb-10 text-gray-300">
            <h2 className="text-xl font-semibold">Sign In</h2>
            <p className="mt-1 text-xs text-gray-500">
              Authenticate with your Google account to get access
            </p>
          </div>

          {/* Social Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-white/5 font-semibold text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(108,79,224,0.3)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <FaGoogle className="text-[#EA4335] transition-transform duration-300 group-hover:scale-110" size={20} />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Footer / Info */}
          <div className="mt-10 text-xs text-gray-500">
            <p>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Login;