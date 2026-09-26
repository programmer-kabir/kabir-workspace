import { useState } from "react";
import { FaGoogle } from "react-icons/fa";
import useAuth from "../../utlis/Hooks/useAuth";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const email = result.user.email;
      const name = result.user.displayName || "DayalStock Contributor";
      const token = await result.user.getIdToken();

      // 1. Check if user exists in DB
      const checkRes = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/internal-auth/get_user_by_email.php`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (checkRes.data.success && checkRes.data.user) {
        const roles = checkRes.data.user.roles || [];

        if (roles.includes("author")) {
          // User is an author → contributor dashboard
          toast.success(`Welcome back, ${checkRes.data.user.name || name}!`);
          navigate("/dashboard");
        } else {
          // User exists but not an author → send to main site
          toast.info("You don't have contributor access. Redirecting...");
          setTimeout(() => {
            window.location.href = "https://dayalstock.com";
          }, 1500);
        }
      } else if (checkRes.data && checkRes.data.message === "User not found") {
        // 2. New user — register with default 'user' role, then redirect to main site
        const randomPassword =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        const userData = { name, email, password: randomPassword };

        const registerRes = await axios.post(
          `${import.meta.env.VITE_LOCALHOST_KEY}/users/create_new_user.php`,
          userData
        );

        if (registerRes.data.success) {
          toast.info(`Welcome, ${name}! You've been registered. Redirecting to main site...`);
          setTimeout(() => {
            window.location.href = "https://dayalstock.com";
          }, 1500);
        } else {
          toast.error(registerRes.data.message || "Failed to register user.");
        }
      } else {
        // Failed to check user existence
        console.error("User check failed:", checkRes.data);
        toast.error(checkRes.data?.message || "An error occurred while verifying your account.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Google Authentication Failed";
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