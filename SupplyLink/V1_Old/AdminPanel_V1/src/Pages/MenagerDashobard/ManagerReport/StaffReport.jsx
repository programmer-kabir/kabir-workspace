import React, { useMemo } from "react";
import useUsers from "../../../utils/Hooks/useUsers";
import { StaffCard } from "../../../components/StaffCard/StaffCard";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import useInvestmentCards from "../../../utils/Investors/useInvestmentCards";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
const toStr = (n) => String(n ?? 0);

const StaffReport = () => {
  const { users = [], isUsersError, isUsersLoading } = useUsers();
  const {
    isCustomerInstallmentsCardsLoading,
    customerInstallmentCards = [],
    isCustomerInstallmentsCardsError,
  } = useCustomerInstallmentCards();
  const {
    investmentCards = [],
    isInvestmentCardsLoading,
    isInvestmentCardsError,
  } = useInvestmentCards();
  const officialStaff = useMemo(() => {
    const allowedRoles = ["manager", "staff", "developer"];

    return (users || []).filter((u) => {
      // roles array
      if (Array.isArray(u.roles)) {
        return u.roles.some((r) =>
          allowedRoles.includes(String(r).toLowerCase())
        );
      }
      // fallback
      const role =
        u.role_name ?? u.role ?? u.user_role ?? u.userType ?? u.type ?? "";
      return allowedRoles.includes(String(role).toLowerCase());
    });
  }, [users]);
  // ✅ Staff-wise stats map (sales + investors)
  const staffStatsMap = useMemo(() => {
    const map = new Map();

    // init staff keys
    officialStaff.forEach((s) => {
      map.set(Number(s.id), { sales: 0, investors: 0 });
    });

    // sales count from installment cards
    (customerInstallmentCards || []).forEach((c) => {
      const refId = Number(c?.reference_user_id);
      if (!refId || !map.has(refId)) return;
      map.get(refId).sales += 1;
    });

    // investors count from investment cards
    (investmentCards || []).forEach((ic) => {
      const refId = Number(ic?.reference_user_id);
      if (!refId || !map.has(refId)) return;
      map.get(refId).investors += 1;
    });

    return map;
  }, [officialStaff, customerInstallmentCards, investmentCards]);

  const getStatsForStaff = (staffId) => {
    const s = staffStatsMap.get(Number(staffId));
    return {
      sales: toStr(s?.sales),
      investors: toStr(s?.investors),
    };
  };
  if (
    isUsersLoading ||
    isCustomerInstallmentsCardsLoading ||
    isInvestmentCardsLoading
  )
    return (
      <div className="text-white p-6">
        <Loader />
      </div>
    );
  if (
    isUsersError ||
    isCustomerInstallmentsCardsError ||
    isInvestmentCardsError
  )
    return (
      <div>
        <NoDataFound />
      </div>
    );

  return (
    <div className="">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">
          Official Staff List
        </h2>
        <span className="text-sm text-slate-300">
          Total: {officialStaff.length}
        </span>
      </div>

      {officialStaff.length === 0 ? (
        <div className="text-slate-400">No staff found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {officialStaff.map((staff) => (
            <StaffCard
              key={staff.id}
              staff={staff}
              installmentCard={customerInstallmentCards}
              investmentCards={investmentCards}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffReport;
