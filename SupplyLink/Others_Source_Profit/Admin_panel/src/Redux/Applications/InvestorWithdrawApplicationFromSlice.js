import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchInvestorWithdrawApplications = createAsyncThunk(
  "investorWithdrawApplications/fetchInvestorWithdrawApplications",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/withdraw_applications/get_withdraw_preview.php`,
      );
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
const InvestorWithdrawApplicationFromSlice = createSlice({
  name: "investorWithdrawApplications",
  initialState: {
    isInvestorWithdrawApplicationsLoading: false,
    investorWithdrawApplications: [],
    isInvestorWithdrawApplicationsError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchInvestorWithdrawApplications.pending, (state) => {
      state.isInvestorWithdrawApplicationsLoading = true;
    });
    builder.addCase(
      fetchInvestorWithdrawApplications.fulfilled,
      (state, action) => {
        state.isInvestorWithdrawApplicationsLoading = false;
        state.investorWithdrawApplications = Array.isArray(action.payload) ? action.payload : [];
        state.isInvestorWithdrawApplicationsError = null;
      },
    );
    builder.addCase(
      fetchInvestorWithdrawApplications.rejected,
      (state, action) => {
        state.isInvestorWithdrawApplicationsLoading = false;
        state.investorWithdrawApplications = [];
        state.isInvestorWithdrawApplicationsError = action.payload || action.error.message;
      },
    );
  },
});

export default InvestorWithdrawApplicationFromSlice.reducer;
