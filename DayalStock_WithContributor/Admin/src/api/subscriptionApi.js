import { authFetch } from "./authFetch";

const BASE = import.meta.env.VITE_LOCALHOST_KEY;

export const getAdminSubscriptionPlans = async () => {
  const res  = await authFetch(`${BASE}/subscriptions/admin_get_all_plans.php`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateSubscriptionPlan = async (plan) => {
  const res  = await authFetch(`${BASE}/subscriptions/update_plan.php`, {
    method: "POST",
    body:   JSON.stringify(plan),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};
