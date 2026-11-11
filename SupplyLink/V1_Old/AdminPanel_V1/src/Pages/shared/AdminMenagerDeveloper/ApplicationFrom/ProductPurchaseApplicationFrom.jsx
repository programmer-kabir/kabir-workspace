import React, { useState } from "react";
import YellowCard from "../../../../components/ProductPurchaseApplicationFrom/YellowCard";
import RedCard from "../../../../components/ProductPurchaseApplicationFrom/RedCard";
import ShopCard from "../../../../components/ProductPurchaseApplicationFrom/ShopCard";
import { TogglePill } from "../../../../components/ProductPurchaseApplicationFrom/FromComponents";
import GreenCard from "../../../../components/ProductPurchaseApplicationFrom/GreenCard";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../../Provider/AuthProvider";
import { toast } from "react-toastify";

const ProductPurchaseApplicationFrom = () => {
  const { user } = useAuth() || {};
  const [activeCard, setActiveCard] = useState("yellow");
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
    shouldUnregister: true, // ✅ only visible fields will be submitted
  });
  const onSubmit = async (data) => {
    try {
      const fd = new FormData();

      // ✅ which card
      fd.append("application_card", activeCard);

      // ✅ meta (optional)
      if (user?.id) fd.append("created_by", String(user.id));

      // ================== COMMON PEOPLE ==================
      fd.append("customer_name", data.customer_name || "");
      fd.append("customer_phone", data.customer_phone || "");
      fd.append("customer_address", data.customer_address || "");

      // files (RHF returns FileList)
      if (data.customer_nid_front?.[0])
        fd.append("customer_nid_front", data.customer_nid_front[0]);
      if (data.customer_nid_back?.[0])
        fd.append("customer_nid_back", data.customer_nid_back[0]);
      if (data.customer_photo?.[0])
        fd.append("customer_photo", data.customer_photo[0]);

      fd.append("guarantor_name", data.guarantor_name || "");
      fd.append("guarantor_phone", data.guarantor_phone || "");
      fd.append("guarantor_address", data.guarantor_address || "");

      if (data.guarantor_nid_front?.[0])
        fd.append("guarantor_nid_front", data.guarantor_nid_front[0]);
      if (data.guarantor_nid_back?.[0])
        fd.append("guarantor_nid_back", data.guarantor_nid_back[0]);
      if (data.guarantor_photo?.[0])
        fd.append("guarantor_photo", data.guarantor_photo[0]);

      // ================== PRODUCT & DEAL ==================
      fd.append("product_name", data.product_name || "");
      fd.append("mrp", String(data.mrp || ""));
      fd.append("sales_price", String(data.sales_price || ""));
      fd.append("down_payment", String(data.down_payment || ""));
      fd.append("installments", String(data.installments || ""));
      fd.append("request_date", data.request_date || "");

      // ================== CARD NOTE (only active one) ==================
      if (activeCard === "green")
        fd.append("green_note", data.green_note || "");
      if (activeCard === "yellow")
        fd.append("yellow_note", data.yellow_note || "");
      if (activeCard === "red") fd.append("red_note", data.red_note || "");
      if (activeCard === "shop") fd.append("shop_note", data.shop_note || "");
      if (data.customer_bank_check?.[0])
        fd.append("customer_bank_check", data.customer_bank_check[0]);

      if (data.customer_bank_statement?.[0])
        fd.append("customer_bank_statement", data.customer_bank_statement[0]);

      // ✅ API call
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/applications/create_customer_application.php`,
        {
          method: "POST",
          body: fd,
          credentials: "include",
        },
      );

      const result = await res.json();
      if (!result?.success) {
        toast.error(result?.message || "Failed");
        return;
      }

      toast.success(`✅ Submitted! Application ID: ${result.application_id}`);
      reset();
      setActiveCard("green");

    } catch (err) {
      // alert("Server error");
      toast.error("Server Failed")
    }
  };

  return (
    <div className=" bg-slate-950 p-4 md:p-6">
      <div className="mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-100">
            Product Purchase Application
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            একসাথে শুধু ১টা card open হবে (Green default)।
          </p>
        </div>

        {/* ✅ Single-select controls */}
        <div className="mb-4 flex flex-wrap gap-2">
          <TogglePill
            label="Green Card"
            tone="green"
            checked={activeCard === "green"}
            onChange={() => setActiveCard("green")}
          />
          <TogglePill
            label="Yellow Card"
            tone="yellow"
            checked={activeCard === "yellow"}
            onChange={() => setActiveCard("yellow")}
          />
          <TogglePill
            label="Red Card"
            tone="red"
            checked={activeCard === "red"}
            onChange={() => setActiveCard("red")}
          />
          <TogglePill
            label="Shop Card"
            tone="shop"
            checked={activeCard === "shop"}
            onChange={() => setActiveCard("shop")}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {activeCard === "green" && (
            <GreenCard register={register} errors={errors} watch={watch} />
          )}
          {activeCard === "yellow" && (
            <YellowCard register={register} errors={errors} watch={watch} />
          )}
          {activeCard === "red" && (
            <RedCard register={register} errors={errors} watch={watch} />
          )}
          {activeCard === "shop" && (
            <ShopCard register={register} errors={errors} watch={watch} />
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveCard("green")}
              className="rounded-xl border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-900"
            >
              Back to Green
            </button>

            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-500"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductPurchaseApplicationFrom;
