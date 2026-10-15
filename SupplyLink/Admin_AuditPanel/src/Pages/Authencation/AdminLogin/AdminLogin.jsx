import Lottie from "lottie-react";
import { useForm } from "react-hook-form";
import loginAnimation from "./login-security.json";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Provider/AuthProvider";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const AdminLogin = () => {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const id = data?.id;
    const password = data?.password;
    const res = await login(id, password);

    if (res.success) {
      toast.success("Login successful");
      navigate("/");
    } else {
      toast.error("Invalid ID or Password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-100"
      >
        {/* Lottie */}
        <div className="flex justify-center mb-4">
          <Lottie animationData={loginAnimation} loop className="w-28" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Admin Panel Login
          </h1>
          <p className="text-sm text-slate-500">
            Authorized staff only
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              placeholder="Enter your ID"
              {...register("id", { required: "User ID is required" })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5
              focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            {errors.id && (
              <p className="text-red-500 text-xs mt-1">
                {errors.id.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                  pattern: {
                    value:
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{6,}$/,
                    message:
                      "Must include uppercase, lowercase, number & special character",
                  },
                })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10
                focus:ring-2 focus:ring-blue-500 outline-none transition"
              />

              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600
            hover:from-blue-700 hover:to-indigo-700
            text-white font-semibold py-2.5 rounded-lg transition shadow-md"
          >
            Login
          </motion.button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2025 Company Name. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;