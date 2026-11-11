import { useState, useEffect, useCallback, useMemo } from "react";

const API = import.meta.env.VITE_LOCALHOST_KEY;

export default function useOtherAssets() {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const res = await fetch(`${API}/other_sources/get_assets.php`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.data || []);
        setSummary(data.summary || null);
      } else {
        setIsError(true);
      }
    } catch (err) {
      console.error("Failed to fetch other assets:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const shareInvestments = useMemo(
    () => (assets || []).filter((a) => a.category === "company_share"),
    [assets]
  );

  const tangibleAssets = useMemo(
    () => (assets || []).filter((a) => a.category !== "company_share"),
    [assets]
  );

  const activeRentAgreements = useMemo(
    () => (assets || []).filter((a) => a.agreement_id && a.agreement_status === "active"),
    [assets]
  );

  const totalShareInvestment = useMemo(
    () => shareInvestments.reduce((sum, a) => sum + Number(a.purchase_price || 0), 0),
    [shareInvestments]
  );

  const totalTangibleAssetValue = useMemo(
    () => tangibleAssets.reduce((sum, a) => sum + Number(a.purchase_price || 0), 0),
    [tangibleAssets]
  );

  const totalMonthlyRent = useMemo(
    () => activeRentAgreements.reduce((sum, a) => sum + Number(a.monthly_rent || 0), 0),
    [activeRentAgreements]
  );

  const totalCollectedIncome = useMemo(
    () => (assets || []).reduce((sum, a) => sum + Number(a.total_collected || 0), 0),
    [assets]
  );

  return {
    assets,
    summary,
    isLoading,
    isError,
    refetch: fetchAssets,
    shareInvestments,
    tangibleAssets,
    activeRentAgreements,
    totalShareInvestment,
    totalTangibleAssetValue,
    totalMonthlyRent,
    totalCollectedIncome,
  };
}
