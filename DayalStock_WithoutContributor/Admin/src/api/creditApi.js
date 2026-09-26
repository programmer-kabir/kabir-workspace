import { authFetch } from "./authFetch";

const BASE = import.meta.env.VITE_LOCALHOST_KEY;

export const getAdminCreditPackages = async () => {
  const res  = await authFetch(`${BASE}/credits/admin_get_all_packages.php`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};

export const updateCreditPackage = async (pkg) => {
  const res  = await authFetch(`${BASE}/credits/update_package.php`, {
    method: "POST",
    body:   JSON.stringify(pkg),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
};
