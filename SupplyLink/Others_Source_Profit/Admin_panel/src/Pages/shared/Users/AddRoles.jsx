import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FaUser, FaUserTag, FaShieldAlt, FaCheckCircle, FaInfoCircle } from "react-icons/fa";
import IconInput from "../../../components/IconInput";
import { ROLES } from "./UsersType";
import BackButton from "../../../components/BackButton/BackButton";

const ROLE_COLORS = {
  admin: "from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30",
  manager: "from-purple-500/20 to-indigo-500/20 text-purple-300 border-purple-500/30",
  staff: "from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30",
  developer: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
  investor: "from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30",
  customer: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30",
  supplier: "from-sky-500/20 to-blue-500/20 text-sky-300 border-sky-500/30",
  granter: "from-slate-500/20 to-gray-500/20 text-slate-300 border-slate-500/30",
  audit: "from-teal-500/20 to-emerald-500/20 text-teal-300 border-teal-500/30",
};

const AddRoles = () => {
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedRole = watch("role");

  const onSubmit = async (data) => {
    // simple validation
    if (!data.user_id) {
      toast.error("User ID দিতে হবে");
      return;
    }
    if (!data.role) {
      toast.error("Role নির্বাচন করতে হবে");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("user_id", data.user_id);
      formData.append("role", data.role);

      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/users/assign_role.php`,
        {
          method: "POST",
          body: formData,
        }
      );
      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Role assign failed");
        return;
      }

      toast.success("Role সফলভাবে assign হয়েছে ✅");
      reset();
    } catch (error) {
      toast.error("সার্ভার সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <BackButton />
        <span className="text-xs text-slate-400 font-mono bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
          User Access Control
        </span>
      </div>

      <div className="card-surface-elevated p-6 md:p-8 rounded-3xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-indigo-500/15 via-purple-500/5 to-transparent blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/[0.08] relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10 shrink-0">
            <FaShieldAlt size={22} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Assign User Role
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              ইউজারের আইডি এবং রোল নির্বাচন করে অধিকার বা অনুমতি প্রদান করুন
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6 relative z-10">
          {/* USER ID */}
          <IconInput
            label="ইউজার আইডি (User ID)"
            icon={FaUser}
            register={register}
            name="user_id"
            placeholder="উদাহরণ: 105"
            type="number"
          />

          {/* ROLE SELECT */}
          <div className="space-y-2">
            <IconInput label="রোল নির্বাচন করুন (Role)" icon={FaUserTag} register={register} name="role">
              <select
                {...register("role")}
                className="bg-transparent text-white w-full py-1 text-sm outline-none cursor-pointer"
              >
                <option value="" className="bg-[#0b132b] text-slate-400">
                  Select a Role
                </option>
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-[#0b132b] text-white">
                    {r.toUpperCase()}
                  </option>
                ))}
              </select>
            </IconInput>

            {/* Quick Clickable Role Badges */}
            <div className="pt-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5 mb-2">
                <FaInfoCircle size={10} className="text-indigo-400" />
                দ্রুত সিলেক্ট করতে রোল এ ক্লিক করুন:
              </span>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => {
                  const isSelected = selectedRole === role;
                  const colorClass = ROLE_COLORS[role] || "from-slate-500/20 to-gray-500/20 text-slate-300 border-slate-500/30";
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setValue("role", role)}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium capitalize transition-all cursor-pointer bg-gradient-to-r ${colorClass} ${
                        isSelected
                          ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#0d162b] scale-105 shadow-md"
                          : "opacity-80 hover:opacity-100 hover:scale-102"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-3 text-sm md:text-base font-bold flex items-center justify-center gap-2"
          >
            <FaCheckCircle size={16} />
            <span>{isSubmitting ? "Assigning..." : "Assign Role নিশ্চিত করুন"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRoles;
