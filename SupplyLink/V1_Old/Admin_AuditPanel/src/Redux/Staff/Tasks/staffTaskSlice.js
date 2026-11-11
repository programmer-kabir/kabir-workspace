import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchStaffTasks = createAsyncThunk(
  "staffTasks/fetchStaffTasks",
  async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/Staff_Tasks/get_staff_tasks.php`,
      );
      return response.data.data;
    } catch (error) {
      return error;
    }
  },
);
const staffTaskSlice = createSlice({
  name: "staffTasks",
  initialState: {
    isStaffTasksLoading: false,
    staffTasks: [],
    isStaffTasksError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchStaffTasks.pending, (state) => {
      state.isStaffTasksLoading = true;
    });
    builder.addCase(fetchStaffTasks.fulfilled, (state, action) => {
      state.isStaffTasksLoading = false;
      state.staffTasks = action.payload;
      state.isStaffTasksError = null;
    });
    builder.addCase(fetchStaffTasks.rejected, (state, action) => {
      state.isStaffTasksLoading = false;
      state.staffTasks = [];
      state.isStaffTasksError = action.error.message;
    });
  },
});

export default staffTaskSlice.reducer;
