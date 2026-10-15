import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../Provider/AuthProvider";

import useCustomerInstallmentCards from "../utils/Hooks/useCustomerInstallmentCards";
import useInvestmentCards from "../utils/Investors/useInvestmentCards";
import useUsers from "../utils/Hooks/useUsers";

import { toNum, toYMD, inSameMonth } from "../utils/dashboardHelpers";
import DashboardHeader from "../components/Dashboard/StaffTasks/DashboardHeader";
import AssignTasksModal from "../components/Dashboard/StaffTasks/AssignTasksModal";
import StaffTasks from "../components/Dashboard/StaffTasks/StaffTasks";
import useStaffTasks from "../utils/Hooks/Staff/useStaffTasks";
import StaffDashboard from "../components/Dashboard/StaffTasks/StaffDashobard/StaffDashboard";
import ProductCalculator from "../components/Dashboard/ProductCalculator/ProductCalculator";
import useStaffTasksRewards from "../utils/Hooks/Staff/useStaffTasksRewards";

const Assign_Tasks = () => {
  const { user } = useAuth() || {};
  const staffId = String(user?.id || "");
  const { isStaffTasksLoading, staffTasks, isStaffTasksError, refetch } =
    useStaffTasks();
  const { isUsersError, isUsersLoading, users = [] } = useUsers();
  const {
    isCustomerInstallmentsCardsLoading,
    customerInstallmentCards,
    isCustomerInstallmentsCardsError,
  } = useCustomerInstallmentCards();
  const { investmentCards, isInvestmentCardsLoading, isInvestmentCardsError } =
    useInvestmentCards();
  const {
    isStaffTasksCreditPointsLoading,
    isStaffTasksCreditPointsError,
    staffTasksCreditPoints,
  } = useStaffTasksRewards();
  const staffUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter(
      (u) => Array.isArray(u.roles) && u.roles.includes("staff"),
    );
  }, [users]);

  const canSeeAssign = useMemo(() => {
    const allowed = ["developer", "manager", "admin"];
    return allowed.includes(user?.role);
  }, [user]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // metrics (keep as you had)
  const metrics = useMemo(() => {
    const cust = Array.isArray(customerInstallmentCards)
      ? customerInstallmentCards
      : [];
    const inv = Array.isArray(investmentCards) ? investmentCards : [];

    const custByStaff = staffId
      ? cust.filter((c) => String(c.reference_user_id) === staffId)
      : cust;
    const invByStaff = staffId
      ? inv.filter((c) => String(c.reference_user_id) === staffId)
      : inv;

    const custMonth = custByStaff.filter((c) =>
      inSameMonth(c.created_at || c.delivery_date, year, month),
    );
    const invMonth = invByStaff.filter((c) =>
      inSameMonth(c.created_at || c.start_date, year, month),
    );

    return {
      cardsSoldThisMonth: custMonth.length,
      totalProfitThisMonth: custMonth.reduce(
        (sum, c) => sum + toNum(c.profit),
        0,
      ),
      totalSalesThisMonth: custMonth.reduce((sum, c) => {
        const salePrice = toNum(c.sale_price);
        if (salePrice > 0) return sum + salePrice;
        return sum + toNum(c.down_payment) + toNum(c.total_due_amount);
      }, 0),
      investmentCardsCreatedThisMonth: invMonth.length,
    };
  }, [customerInstallmentCards, investmentCards, staffId, year, month]);

  // assign modal state
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [assignDueDate, setAssignDueDate] = useState(toYMD(new Date()));
  const [taskRows, setTaskRows] = useState([
    { id: 1, title: "", description: "", priority: "medium", credit_points: 1 },
  ]);

  const addTaskRow = () =>
    setTaskRows((p) => [
      ...p,
      {
        id: Date.now(),
        title: "",
        description: "",
        priority: "medium",
        credit_points: 1,
      },
    ]);
  const removeTaskRow = (id) =>
    setTaskRows((p) => p.filter((r) => r.id !== id));
  const updateTaskRow = (id, field, value) =>
    setTaskRows((p) =>
      p.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );

  const resetAssignForm = () => {
    setTaskRows([
      {
        id: 1,
        title: "",
        description: "",
        priority: "medium",
        credit_points: 1,
      },
    ]);
    setSelectedStaffId("");
    setAssignDueDate(toYMD(new Date()));
  };

  const assignAllTasks = async () => {
    if (!selectedStaffId) return toast.error("Staff নির্বাচন করো");

    const validTasks = taskRows
      .map((r) => ({
        title: String(r.title || "").trim(),
        description: String(r.description || "").trim(),
        priority: String(r.priority || "medium"),
        credit_points: Number(r.credit_points || 0),
      }))
      .filter((t) => t.title);

    if (validTasks.length === 0) return toast.error("অন্তত ১টা task title দাও");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/Staff_Tasks/create_staff_tasks_bulk.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            staff_id: Number(selectedStaffId),
            task_date: toYMD(new Date()),
            due_date: assignDueDate,
            tasks: validTasks,
            created_by: Number(staffId),
            created_at: toYMD(new Date()), // ✅ only date from client
          }),
        },
      );

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success)
        return toast.error(data?.error || "Task assign করতে সমস্যা হয়েছে");

      toast.success(
        `${data.count || validTasks.length} টি task assign হয়েছে ✅`,
      );
      refetch();
      resetAssignForm();
      setOpenAssignModal(false);
    } catch {
      toast.error("Server/Network problem");
    }
  };

  const isLoading =
    isCustomerInstallmentsCardsLoading ||
    isInvestmentCardsLoading ||
    isStaffTasksLoading ||
    isStaffTasksCreditPointsLoading ||
    isUsersLoading;
  const isError =
    isCustomerInstallmentsCardsError ||
    isInvestmentCardsError ||
    isUsersError ||
    isStaffTasksCreditPointsError ||
    isStaffTasksError;

  if (isLoading)
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-300">
        Loading...
      </div>
    );
  if (isError)
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-red-200">
        ডাটা লোড করা যায়নি
      </div>
    );

  return (
    <div className="mx-auto space-y-6">
      {/* <DashboardHeader onOpenAssign={() => setOpenAssignModal(true)} /> */}
      {canSeeAssign && (
        <DashboardHeader onOpenAssign={() => setOpenAssignModal(true)} />
      )}

      {canSeeAssign && (
        <AssignTasksModal
          isOpen={openAssignModal}
          onClose={() => {
            resetAssignForm();
            setOpenAssignModal(false);
          }}
          staffUsers={staffUsers}
          selectedStaffId={selectedStaffId}
          setSelectedStaffId={setSelectedStaffId}
          assignDueDate={assignDueDate}
          setAssignDueDate={setAssignDueDate}
          taskRows={taskRows}
          addTaskRow={addTaskRow}
          removeTaskRow={removeTaskRow}
          updateTaskRow={updateTaskRow}
          onAssignAll={assignAllTasks}
        />
      )}
      {canSeeAssign && (
        <StaffTasks
          staffUsers={staffUsers}
          staffTasks={staffTasks}
          refetch={refetch}
          user={user}
          staffTasksCreditPoints={staffTasksCreditPoints}
        />
      )}
      {!canSeeAssign && (
        <StaffDashboard
          staffTasks={staffTasks}
          user={user}
          users={users}
          staffTasksCreditPoints={staffTasksCreditPoints}
        />
      )}

      <div className="hidden">{metrics.cardsSoldThisMonth}</div>
    </div>
  );
};

export default Assign_Tasks;
