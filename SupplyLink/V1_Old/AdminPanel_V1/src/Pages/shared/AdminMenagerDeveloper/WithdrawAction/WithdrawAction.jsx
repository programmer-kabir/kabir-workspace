import React, { useMemo, useState } from "react";
import useUsers from "../../../../utils/Hooks/useUsers";
import useProfitHistory from "../../../../utils/Investors/useProfitHistory";
import WithdrawTable from "./WithdrawTable";
import { toast } from "react-toastify";
import { useAuth } from "../../../../Provider/AuthProvider";

const WithdrawAction = () => {
  const { user } = useAuth();
  const {
    profitHistory,
    isProfitHistoryLoading,
    isProfitHistoryError,
    refetch, // ✅ must exist in hook (react-query হলে থাকেই)
  } = useProfitHistory({});

  const { isUsersLoading, users, isUsersError } = useUsers();

  // ================= Investor Map =================
  const investorMap = useMemo(() => {
    if (!users) return {};
    return users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [users]);

  // ================= Only Pending Withdraw =================
  const pendingWithdraws = useMemo(() => {
    if (!profitHistory) return [];
    return profitHistory.filter(
      (item) => item.status === "withdraw" && item.action_name === "pending",
    );
  }, [profitHistory]);

  // ================= MODAL STATE =================
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // "approve" | "reject"
  const [selectedItem, setSelectedItem] = useState(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openModal = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setReason("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setModalType(null);
    setSelectedItem(null);
    setReason("");
  };

  // ================= API CALL =================
  const updateProfitAction = async ({ id, action_name, remarks }) => {
    const fd = new FormData();
    fd.append("id", id); // ✅ profit_history.id
    fd.append("action_name", action_name); // approved | rejected
    fd.append("decision_by", user?.id); // decision_by
    fd.append("remarks", remarks); // reason
    const res = await fetch(
      `${import.meta.env.VITE_LOCALHOST_KEY}/profit/update_profit_action.php`,
      {
        method: "POST",
        body: fd,
        credentials: "include",
      },
    );

    return res.json();
  };

  // ================= Handlers =================
  const handleApprove = (item) => openModal("approve", item);
  const handleReject = (item) => openModal("reject", item);

  const confirmAction = async () => {
    if (!selectedItem?.id) {
      toast.error("Missing row id");
      return;
    }

    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("Reason is required");
      return;
    }

    const action_name = modalType === "approve" ? "approved" : "rejected";

    try {
      setSubmitting(true);

      const data = await updateProfitAction({
        id: selectedItem.id, // ✅ backend row id
        action_name,
        remarks: trimmed,
      });

      if (data?.success) {
        toast.success(data?.message || `Withdraw ${action_name}`);
        closeModal();
        refetch?.(); // ✅ refresh list
      } else {
        toast.error(data?.message || "Failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  // ================= Loading / Error =================
  if (isProfitHistoryLoading || isUsersLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (isProfitHistoryError || isUsersError) {
    return <div className="p-4 text-red-500">Something went wrong</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold text-white">
        Pending Withdraw Requests
      </h2>

      {pendingWithdraws.length === 0 && (
        <div className="text-gray-400 mt-6">
          No pending withdraw requests 🎉
        </div>
      )}

      <div className="space-y-3">
        <WithdrawTable
          handleApprove={handleApprove}
          handleReject={handleReject}
          data={pendingWithdraws}
          investorMap={investorMap}
        />
      </div>

      {/* ================= MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* overlay */}
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />

          {/* dialog */}
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {modalType === "approve"
                    ? "Approve Withdraw Request"
                    : "Reject Withdraw Request"}
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  Please write a reason. This will be saved in history.
                </p>
              </div>

              <button
                className="rounded-lg px-2 py-1 text-white/70 hover:bg-white/10"
                onClick={closeModal}
                disabled={submitting}
                type="button"
              >
                ✕
              </button>
            </div>

            {/* preview */}
            <div className="mt-4 rounded-xl bg-black/30 p-3 text-sm text-white/80">
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <div>
                  <span className="text-white/50">Request ID:</span>{" "}
                  {selectedItem?.id ?? "-"}
                </div>
                <div>
                  <span className="text-white/50">Investor:</span>{" "}
                  {investorMap?.[selectedItem?.investor_id]?.name ||
                    selectedItem?.investor_id ||
                    "-"}
                </div>
                <div>
                  <span className="text-white/50">Amount:</span>{" "}
                  {Number(selectedItem?.amount || 0).toLocaleString("en-US")}
                </div>
                <div>
                  <span className="text-white/50">Card:</span>{" "}
                  {selectedItem?.card_id ?? "-"}
                </div>
              </div>
            </div>

            {/* reason input */}
            <div className="mt-4">
              <label className="mb-2 block text-sm text-white/70">
                Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                className="min-h-[110px] w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white outline-none placeholder:text-white/30 focus:border-white/25"
                placeholder={
                  modalType === "approve"
                    ? "Example: Verified balance & request is valid."
                    : "Example: Insufficient documents / mismatch amount."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
              />
              {!reason.trim() && (
                <p className="mt-2 text-xs text-red-400">Reason is required.</p>
              )}
            </div>

            {/* actions */}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-60"
                type="button"
              >
                Cancel
              </button>

              <button
                onClick={confirmAction}
                disabled={submitting || !reason.trim()}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                  modalType === "approve"
                    ? "bg-emerald-600/90 hover:bg-emerald-600"
                    : "bg-rose-600/90 hover:bg-rose-600"
                }`}
                type="button"
              >
                {submitting
                  ? "Saving..."
                  : modalType === "approve"
                    ? "Confirm Approve"
                    : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawAction;
