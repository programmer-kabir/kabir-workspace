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
} from "react-icons/fa";
import IconInput from "../../../components/IconInput";
import useUsers from "../../../utils/Hooks/useUsers";
import useSalesItems from "../../../utils/Hooks/Sales/useSalesItems";

const CreateSalesCards = () => {
  const { register, handleSubmit, reset, watch,setValue } = useForm();
  const [selectedProducts, setSelectedProducts] =
  useState([]);
  const saleType = watch("sale_type", "Installment");
  const { isUsersLoading, users = [], isUsersError } = useUsers();
  const {salesItems,refetch} = useSalesItems()
  const officialStaff = useMemo(() => {
    const allowedRoles = ["admin", "manager", "staff", "developer"];

    return (users || []).filter((u) => {
      // Case A: roles array
      if (Array.isArray(u.roles)) {
        return u.roles.some((r) =>
          allowedRoles.includes(String(r).toLowerCase())
        );
      }

      // Case B: single role fields (fallback)
      const role =
        u.role_name ?? u.role ?? u.user_role ?? u.userType ?? u.type ?? "";
      return allowedRoles.includes(String(role).toLowerCase());
    });
  }, [users]);
const availableItems = salesItems.filter(items=>items.status==="Available")

const addProduct = (productId) => {

  const product = availableItems.find(
    (item) => item.id == productId
  );

  if (!product) return;

  const alreadyExists =
    selectedProducts.some(
      (p) => p.id == product.id
    );

  if (alreadyExists) return;

  const updatedProducts = [
    ...selectedProducts,
    product,
  ];

  setSelectedProducts(
    updatedProducts
  );

  /* AUTO TOTALS */

  const mrpTotal =
    updatedProducts.reduce(
      (sum, p) =>
        sum + Number(p.mrp || 0),
      0
    );

  const saleTotal =
    updatedProducts.reduce(
      (sum, p) =>
        sum + Number(p.sale_price || 0),
      0
    );

  const purchaseTotal =
    updatedProducts.reduce(
      (sum, p) =>
        sum + Number(p.purchase_price || 0),
      0
    );

  setValue(
    "mrp",
    mrpTotal
  );

  setValue(
    "sale_price",
    saleTotal
  );

  setValue(
    "purchase_price",
    purchaseTotal
  );
};

const removeProduct = (id) => {

  const updatedProducts =
    selectedProducts.filter(
      (p) => p.id !== id
    );

  setSelectedProducts(
    updatedProducts
  );

  const mrpTotal =
    updatedProducts.reduce(
      (sum, p) =>
        sum + Number(p.mrp || 0),
      0
    );

  const saleTotal =
    updatedProducts.reduce(
      (sum, p) =>
        sum + Number(p.sale_price || 0),
      0
    );

  const purchaseTotal =
    updatedProducts.reduce(
      (sum, p) =>
        sum + Number(p.purchase_price || 0),
      0
    );

  setValue(
    "mrp",
    mrpTotal
  );

  setValue(
    "sale_price",
    saleTotal
  );

  setValue(
    "purchase_price",
    purchaseTotal
  );
};

const totalMrp =
  selectedProducts.reduce(
    (sum, p) =>
      sum + Number(p.mrp || 0),
    0
  );

const totalSalePrice =
  selectedProducts.reduce(
    (sum, p) =>
      sum + Number(p.sale_price || 0),
    0
  );

const totalPurchasePrice =
  selectedProducts.reduce(
    (sum, p) =>
      sum + Number(p.purchase_price || 0),
    0
  );
  const onSubmit = async (data) => {
    // Required validation (ordered)
    const requiredFields = [
      { key: "card_number", message: "কার্ড নাম্বার দিতে হবে" },
      { key: "user_id", message: "User নির্বাচন করতে হবে" },
      { key: "sale_price", message: "Sale price দিতে হবে" },
      { key: "installment_count", message: "installment count দিতে হবে" },
      { key: "delivery_date", message: "delivery bdate দিতে হবে" },
      {
        key: "first_installment_date",
        message: "first installment date  দিতে হবে",
      },
      {
        key: "reference_user_id",
        message: "reference user id দিতে হবে",
      },
    ];
console.log(data)
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
    }

    try {
      // ================= FORM DATA =================
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });
      selectedProducts.forEach((product) => {

  formData.append(
    "sales_item_ids[]",
    product.id
  );
});
// ================= API CALL =================
      const res = await fetch(
        `${
          import.meta.env.VITE_LOCALHOST_KEYS
        }/sales_cards/create_sales_cards.php`,
        {
          method: "POST",
          body: formData,
        }
      );

const text = await res.text();

// console.log(result)
//       if (!result.success) {
//         toast.error(result.message || "Installment create failed");
//         return;
//       }

      toast.success("Installment Card সফলভাবে তৈরি হয়েছে ✅");
      setSelectedProducts([]);

      reset();
      refetch()
    } catch (error) {
      toast.error("সার্ভার সমস্যা হয়েছে");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-7xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5"
    >
      <h2 className="text-xl font-semibold text-white">
        Create Sales Card
      </h2>

      <IconInput
        label="Card Number"
        icon={FaHashtag}
        register={register}
        name="card_number"
        placeholder="Card Number"
      />

<IconInput
  label="User"
  icon={FaUser}
  register={register}
  name="user_id"
>
  <select
    {...register("user_id")}
    className="bg-[#0F1B2D] text-white w-full py-2"
    disabled={isUsersLoading || isUsersError}
  >
    <option value="">
      {isUsersLoading
        ? "Loading users..."
        : isUsersError
        ? "User load failed"
        : "Select User"}
    </option>

    {users.map((u) => (
      <option key={u.id} value={u.id}>
        {u.id} - {u.name ?? u.full_name ?? u.username}
      </option>
    ))}
  </select>
</IconInput>

<div className="space-y-4">

  {/* SELECT PRODUCT */}

  <div className="bg-[#0F1B2D] border border-white/10 rounded-2xl p-4">

    <label className="text-white mb-2 block font-medium">
      Select Product
    </label>

    <select
      onChange={(e) => {

        if (e.target.value) {

          addProduct(e.target.value);

          e.target.value = "";
        }
      }}
      className="
      w-full
      bg-[#071827]
      border border-white/10
      rounded-xl
      px-4
      py-3
      text-white
      "
    >

      <option value="">
        Select Available Product
      </option>

      {availableItems
        .filter(
          (item) =>
            !selectedProducts.some(
              (p) => p.id === item.id
            )
        )
        .map((item) => (

          <option
            key={item.id}
            value={item.id}
          >
            {item.product_name}
          </option>

        ))}

    </select>

  </div>

  {/* SELECTED PRODUCTS */}

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

    {selectedProducts.map((product) => (

      <div
        key={product.id}
        className="
        bg-[#0F1B2D]
        border border-white/10
        rounded-2xl
        p-4
        relative
        overflow-hidden
        "
      >

        {/* IMAGE */}



        {/* INFO */}

        <h3 className="text-white text-lg font-semibold">
          {product.product_name}
        </h3>

        <div className="mt-3 space-y-1 text-sm">

          <p className="text-slate-300">
            MRP:
            <span className="text-white ml-2">
              {product.mrp}
            </span>
          </p>

          <p className="text-slate-300">
            Sale Price:
            <span className="text-green-400 ml-2">
              {product.sale_price}
            </span>
          </p>

          <p className="text-slate-300">
            Purchase Price:
            <span className="text-orange-400 ml-2">
              {product.purchase_price}
            </span>
          </p>

        </div>

        {/* REMOVE */}

        <button
          type="button"
          onClick={() =>
            removeProduct(product.id)
          }
          className="
          mt-4
          w-full
          bg-red-500/20
          hover:bg-red-500/30
          text-red-400
          py-2
          rounded-xl
          transition-all
          "
        >
          Remove
        </button>

      </div>

    ))}

  </div>

  {/* TOTALS */}

  {selectedProducts.length > 0 && (

    <div
      className="
      bg-[#0F1B2D]
      border border-white/10
      rounded-2xl
      p-5
      grid grid-cols-1 md:grid-cols-3 gap-4
      "
    >

      <div>

        <p className="text-slate-400 text-sm">
          Total MRP
        </p>

        <h2 className="text-white text-2xl font-bold">
          {totalMrp}
        </h2>

      </div>

      <div>

        <p className="text-slate-400 text-sm">
          Total Sale Price
        </p>

        <h2 className="text-green-400 text-2xl font-bold">
          {totalSalePrice}
        </h2>

      </div>

      <div>

        <p className="text-slate-400 text-sm">
          Total Purchase Price
        </p>

        <h2 className="text-orange-400 text-2xl font-bold">
          {totalPurchasePrice}
        </h2>

      </div>

    </div>

  )}

</div>

      <div className="grid grid-cols-2 gap-4">
                <IconInput
          label="Additional Cost"
          icon={FaMoneyBillWave}
          register={register}
          name="additional_cost"
          placeholder="Additional Cost"
          type="number"
        />
        <IconInput
          label="Sale Price"
          icon={FaMoneyBillWave}
          register={register}
          name="sale_price"
          placeholder="Sale Price"
          type="number"
        />

      </div>



      <IconInput
        label="Sale Type"
        icon={FaStore}
        register={register}
        name="sale_type"
      >
        <select
          {...register("sale_type")}
          className="bg-[#0F1B2D] text-white w-full py-2"
        >
          <option value="Installment">Installment</option>
          <option value="Cash">Cash</option>
        </select>
      </IconInput>

      {saleType === "Installment" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <IconInput
              label="Down Payment"
              icon={FaMoneyBillWave}
              register={register}
              name="down_payment"
              type="number"
            />

            <IconInput
              label="Installment Count"
              icon={FaHashtag}
              register={register}
              name="installment_count"
              type="number"
            />
          </div>
          <IconInput
            label="Per Installment Amount"
            icon={FaCalculator}
            register={register}
            name="per_installment_amount"
            placeholder="Per installment amount"
            type="number"
          />

          <IconInput
            label="First Installment Date"
            icon={FaCalendarAlt}
            register={register}
            name="first_installment_date"
            type="date"
            style={{ colorScheme: "dark" }}
          />
        </>
      )}

      <IconInput
        label="Delivery Date"
        icon={FaTruck}
        register={register}
        name="delivery_date"
        type="date"
        style={{ colorScheme: "dark" }}
      />
      <IconInput
        label="Reference (Official Staff)"
        icon={FaUser}
        register={register}
        name="reference_user_id"
      >
        <select
          {...register("reference_user_id")}
          className="bg-[#0F1B2D] text-white w-full py-2"
          disabled={isUsersLoading || isUsersError}
        >
          <option value="">
            {isUsersLoading
              ? "Loading staff..."
              : isUsersError
              ? "Staff load failed"
              : "Select Reference Staff"}
          </option>

          {officialStaff.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.full_name ?? u.username ?? `User#${u.id}`}
            </option>
          ))}
        </select>
      </IconInput>
      <input
  type="hidden"
  {...register("mrp")}
/>

<input
  type="hidden"
  {...register("purchase_price")}
/>
      <button className="w-full py-2 bg-blue-600 rounded-xl text-white">
        Create Installment Card
      </button>
    </form>
  );
};

export default CreateSalesCards;
