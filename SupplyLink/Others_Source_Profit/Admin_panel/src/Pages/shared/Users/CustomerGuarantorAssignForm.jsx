import React, { useMemo, useState } from "react";
import useUsers from "../../../utils/Hooks/useUsers";
import { useAuth } from "../../../Provider/AuthProvider";
import { RELATION_OPTIONS } from "../../../../public/relationOptions";
import { toast } from "react-toastify";

export default function CustomerGuarantorAssignForm() {
  const [customer_user_id, setCustomerUserId] = useState("");
  const [guarantor_user_id, setGuarantorUserId] = useState("");
  const [is_primary, setIsPrimary] = useState(true);
  const [relation, setRelation] = useState("");
  const [relationOther, setRelationOther] = useState("");

  const { users = [] } = useUsers();
  const { user } = useAuth();

  const hasRole = (u, role) =>
    Array.isArray(u?.roles) && u.roles.includes(role);

  const customerList = useMemo(() => {
    return (Array.isArray(users) ? users : []).filter((u) =>
      hasRole(u, "customer"),
    );
  }, [users]);

  const granterList = useMemo(() => {
    return (Array.isArray(users) ? users : []).filter(
      (u) => hasRole(u, "granter") || hasRole(u, "guarantor"),
    );
  }, [users]);

  const selectedCustomer = useMemo(
    () => customerList.find((u) => String(u.id) === String(customer_user_id)),
    [customerList, customer_user_id],
  );

  const selectedGranter = useMemo(
    () => granterList.find((u) => String(u.id) === String(guarantor_user_id)),
    [granterList, guarantor_user_id],
  );

  const resetForm = () => {
    setCustomerUserId("");
    setGuarantorUserId("");
    setIsPrimary(true);
    setRelation("");
    setRelationOther("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error("Login user পাওয়া যাচ্ছে না");
      return;
    }

    const finalRelation =
      relation === "other" ? relationOther.trim() : relation;

    if (!finalRelation) {
      toast.error("Relation select/লিখুন");
      return;
    }

    // ✅ POST as FormData (PHP $_POST will read it)
    const formData = new FormData();
    formData.append("customer_user_id", String(customer_user_id));
    formData.append("guarantor_user_id", String(guarantor_user_id));
    formData.append("relation", finalRelation);
    formData.append("is_primary", is_primary ? "1" : "0");
    formData.append("assigned_by", String(user.id));
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/users/create_customer_guarantor.php`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );

      const result = await res.json();

      if (!res.ok || !result?.success) {
        toast.error(result?.message || "Guarantor assign failed");
        return;
      }

      toast.success(result?.message || "Guarantor assigned ✅");
      resetForm();
    } catch (error) {
      toast.error("সার্ভার সমস্যা হয়েছে");
    }
  };

  // relation change হলে other input clean
  const handleRelationChange = (val) => {
    setRelation(val);
    if (val !== "other") setRelationOther("");
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/40 shadow-xl">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Assign Granter</h2>
          <p className="text-sm text-slate-300 mt-1">
            Customer এর সাথে Granter/Guarantor link করো
          </p>

          <div className="mt-3 text-xs text-slate-400">
            Assigned by:{" "}
            <span className="text-slate-200">{user?.name || "Unknown"}</span>
            {user?.id ? (
              <span className="text-slate-500"> (ID: {user.id})</span>
            ) : null}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-slate-200">Customer</label>
            <select
              value={customer_user_id}
              onChange={(e) => setCustomerUserId(e.target.value)}
              className="w-full rounded-xl bg-slate-950/40 border border-white/10 px-4 py-3 outline-none focus:border-blue-500/60"
              required
            >
              <option value="">Select customer</option>
              {customerList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.mobile ? `(${c.mobile})` : ""} — ID:{c.id}
                </option>
              ))}
            </select>

            {selectedCustomer ? (
              <p className="text-xs text-slate-400">
                Selected:{" "}
                <span className="text-slate-200">{selectedCustomer.name}</span>
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">
              Granter / Guarantor
            </label>
            <select
              value={guarantor_user_id}
              onChange={(e) => setGuarantorUserId(e.target.value)}
              className="w-full rounded-xl bg-slate-950/40 border border-white/10 px-4 py-3 outline-none focus:border-blue-500/60"
              required
            >
              <option value="">Select granter</option>
              {granterList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} {g.mobile ? `(${g.mobile})` : ""} — ID:{g.id}
                </option>
              ))}
            </select>

            {selectedGranter ? (
              <p className="text-xs text-slate-400">
                Selected:{" "}
                <span className="text-slate-200">{selectedGranter.name}</span>
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <input
              id="is_primary"
              type="checkbox"
              checked={is_primary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-5 w-5 rounded border-white/20 bg-slate-950/40"
            />
            <label htmlFor="is_primary" className="text-sm text-slate-200">
              Primary granter
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">
              Relation with Customer
            </label>
            <select
              value={relation}
              onChange={(e) => handleRelationChange(e.target.value)}
              className="w-full rounded-xl bg-slate-950/40 border border-white/10 px-4 py-3"
              required
            >
              <option value="">Select relation</option>
              {RELATION_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {relation === "other" && (
            <div className="space-y-2">
              <label className="text-sm text-slate-200">Specify relation</label>
              <input
                value={relationOther}
                onChange={(e) => setRelationOther(e.target.value)}
                placeholder="উদাহরণ: মামাতো ভাই, শ্বশুর, গার্ডিয়ান"
                className="w-full rounded-xl bg-slate-950/40 border border-white/10 px-4 py-3"
                required
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 transition px-4 py-3 font-medium"
            >
              Save Assign
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/10 bg-slate-950/40 hover:bg-slate-900 transition px-4 py-3 font-medium"
            >
              Reset
            </button>
          </div>

          <p className="text-xs text-slate-400">
            * users থেকে role দেখে customer/granter list auto show হচ্ছে।
          </p>
        </form>
      </div>
    </div>
  );
}
