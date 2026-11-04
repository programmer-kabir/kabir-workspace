import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const getDhakaToday = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
  }).format(new Date());
};

const useTodayCashReport = (targetDate) => {
  const [cashSummary, setCashSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(null);

  const activeDate = targetDate || getDhakaToday();

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);

    try {
      const baseUrl = import.meta.env.VITE_LOCALHOST_KEY || "https://management.supplylinkbd.com/apis";
      const response = await axios.get(
        `${baseUrl}/cash/today_cash_summary.php?date=${activeDate}`,
        { withCredentials: true }
      );

      if (response.data && response.data.success) {
        setCashSummary(response.data);
      } else {
        throw new Error(response.data?.message || "ক্যাশ রিপোর্ট লোড করা যায়নি");
      }
    } catch (err) {
      console.error("Error fetching cash summary:", err);
      setIsError(err?.response?.data?.message || err.message || "Failed to load summary");
    } finally {
      setIsLoading(false);
    }
  }, [activeDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    cashSummary,
    isLoading,
    isError,
    refetch: fetchSummary,
  };
};

export default useTodayCashReport;
