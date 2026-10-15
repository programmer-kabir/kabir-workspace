import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStaffTasks } from "../../../Redux/Staff/Tasks/staffTaskSlice";

export default function useStaffTasks() {
  const dispatch = useDispatch();

  const { isStaffTasksLoading, staffTasks, isStaffTasksError } = useSelector(
    (state) => state.staffTasks,
  );

  const fetch = useCallback(() => {
    dispatch(fetchStaffTasks());
  }, [dispatch]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    isStaffTasksLoading,
    staffTasks,
    isStaffTasksError,
    refetch: fetch,
  };
}
