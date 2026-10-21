import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AuthContext } from "../../Provider/AuthProvider";
import Lottie from "lottie-react";
import loginAnimation from "./login-security.json";
import { toast } from "react-toastify";

export default function LoginForm() {
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const hasImpersonatedRef = useRef(false);

  const onSubmit = async (formData) => {
    const { id, password } = formData;

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/Login/login.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ id, password }),
        }
      );

      let data;

      try {
        data = await res.json();
      } catch {
        toast.error("Server error, পরে আবার চেষ্টা করুন");
        return;
      }

      if (!data.valid) {
        toast.error(data.message || "Invalid ID or Password");
        return;
      }

      // Save user to context and localStorage
      loginUser(data.user);

      toast.success(`${data?.user?.name} আপনার লগইন সম্পন্ন হয়েছে`);

      navigate("/");
    } catch (err) {
      toast.error("Network error! আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  // Direct Impersonate / Login as user without password (admin/manager access)
  useEffect(() => {
    const impersonateId =
      searchParams.get("impersonate_id") || searchParams.get("userId");
    if (!impersonateId || hasImpersonatedRef.current) return;
    hasImpersonatedRef.current = true;

    const directLogin = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_LOCALHOST_KEY}/users/users.php`
        );
        const data = await res.json();
        const userList = Array.isArray(data) ? data : data?.data || [];
        const found = userList.find(
          (u) => Number(u.id) === Number(impersonateId)
        );

        if (found) {
          // Set role preference if user has roles
          const roles = found.roles || [];
          if (roles.includes("customer")) {
            localStorage.setItem("activeRole", "customer");
          } else if (roles.includes("investor")) {
            localStorage.setItem("activeRole", "investor");
          }

          loginUser({
            id: String(found.id),
            name: found.name,
            mobile: found.mobile,
          });
          toast.success(`${found.name} এর ড্যাশবোর্ডে প্রবেশ করা হয়েছে 🎉`, {
            toastId: "impersonate_success",
          });
          navigate("/");
        } else {
          toast.error("ইউজার পাওয়া যায়নি", { toastId: "impersonate_error" });
        }
      } catch (err) {
        console.error("Direct login error:", err);
        toast.error("লগইন করতে সমস্যা হয়েছে", { toastId: "impersonate_error" });
      } finally {
        setLoading(false);
      }
    };

    directLogin();
  }, [searchParams]);

  // URL থেকে ID + Password auto fill
  useEffect(() => {
    const id = searchParams.get("id");
    const password = searchParams.get("password");

    if (id) setValue("id", id);
    if (password) setValue("password", password);
  }, [searchParams, setValue]);

  // Auto Login if URL params present
  useEffect(() => {
    const id = searchParams.get("id");
    const password = searchParams.get("password");

    if (!id || !password) return;

    onSubmit({
      id,
      password,
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
        <div className="flex justify-center mb-4">
          <Lottie animationData={loginAnimation} loop className="w-28" />
        </div>

        <h2 className="text-2xl font-semibold text-slate-800 text-center mb-1">
          User Login
        </h2>

        <p className="text-sm text-slate-500 text-center mb-4">
          আপনার আইডি বা মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে লগইন করুন
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              User ID / মোবাইল নম্বর
            </label>

            <input
              type="text"
              placeholder="যেমন: 1 বা 01941145876"
              {...register("id", { required: "ID অথবা মোবাইল নম্বর আবশ্যক" })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
            />

            {errors.id && (
              <p className="text-xs text-red-500 mt-1">
                {errors.id.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>

            <input
              type="password"
              placeholder="আপনার পাসওয়ার্ড"
              autoComplete="new-password"
              {...register("password", {
                required: "Password আবশ্যক",
                minLength: {
                  value: 3,
                  message: "কমপক্ষে ৩ অক্ষর হতে হবে",
                },
              })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none"
            />

            {errors.password && (
              <p className="text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 inline-flex justify-center items-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-150 ${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}