import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchStaffTasksCreditPoints = createAsyncThunk(
  "staffTasksCreditPoints/fetchStaffTasksCreditPoints",
  async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/Staff_Tasks/get_staff_credit_ledger.php`,
      );
      return response.data.data;
    } catch (error) {
      return error;
    }
  },
);
const staffTaskPointSlice = createSlice({
  name: "staffTasksCreditPoints",
  initialState: {
    isStaffTasksCreditPointsLoading: false,
    staffTasksCreditPoints: [],
    isStaffTasksCreditPointsError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchStaffTasksCreditPoints.pending, (state) => {
      state.isStaffTasksCreditPointsLoading = true;
    });
    builder.addCase(fetchStaffTasksCreditPoints.fulfilled, (state, action) => {
      state.isStaffTasksCreditPointsLoading = false;
      state.staffTasksCreditPoints = action.payload;
      state.isStaffTasksCreditPointsError = null;
    });
    builder.addCase(fetchStaffTasksCreditPoints.rejected, (state, action) => {
      state.isStaffTasksCreditPointsLoading = false;
      state.staffTasksCreditPoints = [];
      state.isStaffTasksCreditPointsError = action.error.message;
    });
  },
});

export default staffTaskPointSlice.reducer;
