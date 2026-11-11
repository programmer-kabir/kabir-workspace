import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStaffTasksCreditPoints } from "../../../Redux/Staff/StaffPoints/staffTaskPointSlice";

export default function useStaffTasksRewards() {
  const dispatch = useDispatch();

  const {
    isStaffTasksCreditPointsLoading,
    staffTasksCreditPoints,
    isStaffTasksCreditPointsError,
  } = useSelector((state) => state.staffTasksCreditPoints);

  const fetch = useCallback(() => {
    dispatch(fetchStaffTasksCreditPoints());
  }, [dispatch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    isStaffTasksCreditPointsLoading,
    staffTasksCreditPoints,
    isStaffTasksCreditPointsError,
    refetch: fetch,
  };
}
