import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  FaUser,
  FaHashtag,
  FaBox,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaTruck,
  FaStore,
  FaCalculator,
  FaCheckCircle,
} from "react-icons/fa";
import { RiBankCard2Line } from "react-icons/ri";
import IconInput from "../../../components/IconInput";
import useUsers from "../../../utils/Hooks/useUsers";
import BackButton from "../../../components/BackButton/BackButton";

const CreateInstallmentCards = () => {
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      sale_type: "Installment",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const saleType = watch("sale_type", "Installment");
  const { isUsersLoading, users = [], isUsersError } = useUsers();

  const officialStaff = useMemo(() => {
    const allowedRoles = ["admin", "manager", "staff", "developer"];

    return (users || []).filter((u) => {
      if (Array.isArray(u.roles)) {
        return u.roles.some((r) =>
          allowedRoles.includes(String(r).toLowerCase())
        );
      }
      const role =
        u.role_name ?? u.role ?? u.user_role ?? u.userType ?? u.type ?? "";
      return allowedRoles.includes(String(role).toLowerCase());
    });
  }, [users]);

  const onSubmit = async (data) => {
    // Required validation (ordered)
    const requiredFields = [
      { key: "card_number", message: "কার্ড নাম্বার দিতে হবে" },
      { key: "user_id", message: "User নির্বাচন করতে হবে" },
      { key: "product_name", message: "Product নাম দিতে হবে" },
      { key: "mrp", message: "MRP দিতে হবে" },
      { key: "sale_price", message: "Sale price দিতে হবে" },
      { key: "purchase_price", message: "purchase price দিতে হবে" },
      { key: "delivery_date", message: "delivery date দিতে হবে" },
      {
        key: "reference_user_id",
        message: "reference user id দিতে হবে",
      },
    ];

    for (let field of requiredFields) {
      if (!data[field.key]) {
        toast.error(field.message);
        return;
      }
    }

    if (data.sale_type === "Installment") {
      if (!data.installment_count) {
        toast.error("Installment count দিতে হবে");
        return;
      }
      if (!data.first_installment_date) {
        toast.error("first installment date দিতে হবে");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // ================= FORM DATA =================
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });

      // ================= API CALL =================
      const res = await fetch(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/customers/create_installment_card.php`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await res.json();
      if (!result.success) {
        toast.error(result.message || "Installment create failed");
        return;
      }

      toast.success("Installment Card সফলভাবে তৈরি হয়েছে ✅");
      reset();
    } catch (error) {
      toast.error("সার্ভার সমস্যা হয়েছে");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5 animate-fadeIn">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <BackButton />
        <span className="text-xs text-slate-400 font-mono bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
          Customer Management • New Card
        </span>
      </div>

      {/* Main Form Card */}
      <div className="card-surface-elevated p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-28 bg-gradient-to-b from-indigo-500/15 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/[0.08] relative z-10">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600/30 via-purple-600/25 to-pink-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-xl shadow-indigo-500/15 shrink-0">
            <RiBankCard2Line size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Create Installment Card
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              নতুন প্রোডাক্ট কিস্তি কার্ডের বিবরণী, প্রাইসিং ও কিস্তির শর্ত নির্ধারণ করুন
            </p>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card Number */}
            <IconInput
              label="কার্ড নম্বর (Card Number) *"
              icon={FaHashtag}
              register={register}
              name="card_number"
              placeholder="উদাহরণ: SL-2024-001"
            />

            {/* Customer User ID */}
            <IconInput
              label="গ্রাহক আইডি (Customer User ID) *"
              icon={FaUser}
              register={register}
              name="user_id"
              placeholder="গ্রাহকের ইউজার আইডি (যেমন: 102)"
              type="number"
            />

            {/* Product Name */}
            <div className="md:col-span-2">
              <IconInput
                label="প্রোডাক্টের নাম ও মডেল (Product Name) *"
                icon={FaBox}
                register={register}
                name="product_name"
                placeholder="উদাহরণ: Walton Primo H10 (4GB/64GB)"
              />
            </div>

            {/* MRP & Sale Price */}
            <IconInput
              label="MRP রেগুলার মূল্য (৳) *"
              icon={FaMoneyBillWave}
              register={register}
              name="mrp"
              placeholder="0.00"
              type="number"
            />

            <IconInput
              label="বিক্রয় মূল্য Sale Price (৳) *"
              icon={FaMoneyBillWave}
              register={register}
              name="sale_price"
              placeholder="0.00"
              type="number"
            />

            {/* Purchase Price & Additional Cost */}
            <IconInput
              label="ক্রয় মূল্য Purchase Price (৳) *"
              icon={FaMoneyBillWave}
              register={register}
              name="purchase_price"
              placeholder="0.00"
              type="number"
            />

            <IconInput
              label="অতিরিক্ত খরচ Additional Cost (৳)"
              icon={FaMoneyBillWave}
              register={register}
              name="additional_cost"
              placeholder="0.00"
              type="number"
            />

            {/* Sale Type */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold tracking-wide text-slate-300 block">
                বিক্রির ধরণ (Sale Type) *
              </label>
              <div className="flex items-center gap-3">
                {["Installment", "Cash"].map((type) => {
                  const isSelected = saleType === type;
                  return (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setValue("sale_type", type)}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20"
                          : "bg-white/[0.04] text-slate-400 border-white/10 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {type === "Installment" ? "কিস্তি (Installment Sale)" : "নগদ (Cash Sale)"}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" {...register("sale_type")} />
            </div>

            {/* Conditional Installment Parameters */}
            {saleType === "Installment" && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 p-4 rounded-2xl bg-black/25 border border-indigo-500/20">
                <IconInput
                  label="ডাউন পেমেন্ট Down Payment (৳)"
                  icon={FaMoneyBillWave}
                  register={register}
                  name="down_payment"
                  placeholder="0.00"
                  type="number"
                />

                <IconInput
                  label="মোট কিস্তির সংখ্যা (Installment Count) *"
                  icon={FaHashtag}
                  register={register}
                  name="installment_count"
                  placeholder="যেমন: 6 বা 12"
                  type="number"
                />

                <IconInput
                  label="প্রতি কিস্তির পরিমাণ (Per Installment ৳)"
                  icon={FaCalculator}
                  register={register}
                  name="per_installment_amount"
                  placeholder="0.00"
                  type="number"
                />

                <IconInput
                  label="১ম কিস্তির তারিখ (First Installment Date) *"
                  icon={FaCalendarAlt}
                  register={register}
                  name="first_installment_date"
                  type="date"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            )}

            {/* Delivery Date */}
            <IconInput
              label="ডেলিভারির তারিখ (Delivery Date) *"
              icon={FaTruck}
              register={register}
              name="delivery_date"
              type="date"
              style={{ colorScheme: "dark" }}
            />

            {/* Reference Official Staff */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide text-slate-300">
                রেফারেন্স স্টাফ (Official Staff) *
              </label>
              <div className="flex items-center gap-2.5 bg-[#091122] border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <FaUser className="text-slate-400 shrink-0" />
                <select
                  {...register("reference_user_id")}
                  className="bg-transparent text-white w-full py-0.5 text-sm outline-none cursor-pointer"
                  disabled={isUsersLoading || isUsersError}
                >
                  <option value="" className="bg-[#0b132b] text-slate-400">
                    {isUsersLoading
                      ? "স্টাফ লোড হচ্ছে..."
                      : isUsersError
                      ? "স্টাফ লোড ব্যর্থ হয়েছে"
                      : "-- রেফারেন্স স্টাফ নির্বাচন করুন --"}
                  </option>
                  {officialStaff.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#0b132b] text-white">
                      {u.name ?? u.full_name ?? u.username ?? `User#${u.id}`} (ID: {u.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Supplier ID */}
            <div>
              <IconInput
                label="সাপ্লায়ার আইডি (Supplier ID)"
                icon={FaStore}
                register={register}
                name="supplier_id"
                placeholder="সাপ্লায়ার আইডি (ঐচ্ছিক)"
                type="number"
              />
            </div>

            {/* Installment Type (Regular vs Daily) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide text-cyan-300">
                কিস্তির ধরণ (Installment Type) *
              </label>
              <div className="flex items-center gap-2.5 bg-[#091122] border border-cyan-500/30 rounded-xl px-3.5 py-2.5 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
                <FaCalendarAlt className="text-cyan-400 shrink-0" />
                <select
                  {...register("is_daily")}
                  defaultValue={0}
                  className="bg-transparent text-white w-full py-0.5 text-sm outline-none cursor-pointer"
                >
                  <option value={0} className="bg-[#0b132b] text-white">
                    সাধারণ কিস্তি (Regular Installment)
                  </option>
                  <option value={1} className="bg-[#0b132b] text-cyan-300 font-bold">
                    ⚡ দৈনিক কিস্তি (Daily Installment)
                  </option>
                </select>
              </div>
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <IconInput
                label="মন্তব্য (Remarks - নোট/তথ্য)"
                icon={FaHashtag}
                register={register}
                name="remarks"
                placeholder="যেকোনো বিশেষ মন্তব্য বা নোট..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 text-base font-bold shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              <FaCheckCircle size={17} />
              <span>{isSubmitting ? "কার্ড তৈরি হচ্ছে..." : "Create Installment Card (নিশ্চিত করুন)"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInstallmentCards;
