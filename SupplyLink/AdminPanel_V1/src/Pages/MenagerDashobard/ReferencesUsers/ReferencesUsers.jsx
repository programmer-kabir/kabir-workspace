import React, { useMemo } from "react";
import { useSearchParams, Navigate, Link } from "react-router-dom";
import useUsers from "../../../utils/Hooks/useUsers";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import useInvestmentCards from "../../../utils/Investors/useInvestmentCards";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import BackButton from "../../../components/BackButton/BackButton";

const ALLOWED_ROLES = ["admin", "manager", "staff", "developer"];

const pickName = (u) =>
  u?.name ?? u?.full_name ?? u?.username ?? `User#${u?.id}`;

const getAvatarSrc = (name, photo) => {
  // ✅ empty string না পাঠিয়ে fallback দিচ্ছি
  if (photo) return `https://app.supplylinkbd.com/${photo}`;
  return (
    "https://ui-avatars.com/api/?name=" +
    encodeURIComponent(name || "User") +
    "&background=0D2235&color=fff"
  );
};

const isOfficialStaff = (u) => {
  if (!u) return false;

  if (Array.isArray(u.roles)) {
    return u.roles.some((r) =>
      ALLOWED_ROLES.includes(String(r).toLowerCase().trim())
    );
  }

  const role =
    u?.role_name ?? u?.role ?? u?.user_role ?? u?.userType ?? u?.type ?? "";
  return ALLOWED_ROLES.includes(String(role).toLowerCase().trim());
};

const ReferencesUsers = () => {
  // ✅ hooks always top-level
  const [searchParams] = useSearchParams();
  const staffIdRaw = searchParams.get("staffId");

  const { users = [], isUsersLoading, isUsersError } = useUsers();
  const {
    customerInstallmentCards = [],
    isCustomerInstallmentsCardsLoading,
    isCustomerInstallmentsCardsError,
  } = useCustomerInstallmentCards();
  const {
    investmentCards = [],
    isInvestmentCardsLoading,
    isInvestmentCardsError,
  } = useInvestmentCards();

  // ✅ parse staffId in memo (safe)
  const staffId = useMemo(() => {
    const n = Number(staffIdRaw);
    return Number.isFinite(n) ? n : 0;
  }, [staffIdRaw]);

  // ✅ staff find (safe even if users empty)
  const staff = useMemo(() => {
    if (!staffId) return null;
    return users.find((u) => Number(u.id) === staffId) ?? null;
  }, [users, staffId]);

  // ✅ referred user IDs
  const referredUserIds = useMemo(() => {
    const set = new Set();
    if (!staffId) return set;

    customerInstallmentCards.forEach((c) => {
      if (Number(c?.reference_user_id) === staffId) {
        const uid = Number(c?.user_id);
        if (uid) set.add(uid);
      }
    });

    investmentCards.forEach((ic) => {
      if (Number(ic?.reference_user_id) === staffId) {
        const uid = Number(ic?.investor_id);
        if (uid) set.add(uid);
      }
    });

    return set;
  }, [customerInstallmentCards, investmentCards, staffId]);

  // ✅ final users list
  const referredUsers = useMemo(() => {
    if (!referredUserIds.size) return [];
    return users.filter((u) => referredUserIds.has(Number(u.id)));
  }, [users, referredUserIds]);

  // ✅ now early returns (after all hooks)
  if (!staffId) return <Navigate to="/error" replace />;

  if (
    isUsersLoading ||
    isCustomerInstallmentsCardsLoading ||
    isInvestmentCardsLoading
  ) {
    return (
      <div className="p-6">
        <Loader />
      </div>
    );
  }

  if (
    isUsersError ||
    isCustomerInstallmentsCardsError ||
    isInvestmentCardsError
  ) {
    return (
      <div className="p-6">
        <NoDataFound />
      </div>
    );
  }
  const usersReady = Array.isArray(users) && users.length > 0;

  if (!isUsersLoading && usersReady) {
    if (!staff || !isOfficialStaff(staff)) {
      return <Navigate to="/*" replace />;
    }
  }

  // if (!staff || !isOfficialStaff(staff)) {
  //   return <Navigate to="/error" replace />;
  // }

  const staffName = pickName(staff);
  const staffAvatar = getAvatarSrc(staffName, staff?.photo);

  return (
    <div className="p-6">
      <BackButton />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={staffAvatar}
            alt={staffName}
            className="w-12 h-12 rounded-full border border-white/10 object-cover bg-white/5"
          />
          <div>
            <h2 className="text-xl font-semibold text-white">
              Users Referred by {staffName}
            </h2>
            <p className="text-sm text-white/60 mt-1">
              Staff ID: {staffId} • Total Users: {referredUsers.length}
            </p>
          </div>
        </div>

        <Link
          to="/manager_reports"
          className="rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white px-4 py-2 text-sm transition"
        >
          Back to Staff List
        </Link>
      </div>

      <div className="mt-6">
        {referredUsers.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-slate-300">
            No referred users found for this staff.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {referredUsers.map((u) => {
              const name = pickName(u);
              const avatar = getAvatarSrc(name, u?.photo);

              return (
                <div
                  key={u.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:bg-white/[0.07] transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar}
                      alt={name}
                      className="w-12 h-12 rounded-full border border-white/10 object-cover bg-white/5"
                    />
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">
                        {name}
                      </p>
                      <p className="text-xs text-slate-300">User ID: {u.id}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-400">
                    {Array.isArray(u.roles)
                      ? u.roles.join(", ")
                      : u.role_name ?? u.role ?? ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferencesUsers;
