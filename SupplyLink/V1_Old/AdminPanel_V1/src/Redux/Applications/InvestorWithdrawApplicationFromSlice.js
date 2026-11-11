import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchInvestorWithdrawApplications = createAsyncThunk(
  "investorWithdrawApplications/fetchInvestorWithdrawApplications",
  async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/withdraw_applications/get_withdraw_preview.php`,
      );
      return response.data.data;
    } catch (error) {
      return error;
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
        state.investorWithdrawApplications = action.payload;
        state.isInvestorWithdrawApplicationsError = null;
      },
    );
    builder.addCase(
      fetchInvestorWithdrawApplications.rejected,
      (state, action) => {
        state.isInvestorWithdrawApplicationsLoading = false;
        state.investorWithdrawApplications = [];
        state.isInvestorWithdrawApplicationsError = action.error.message;
      },
    );
  },
});

export default InvestorWithdrawApplicationFromSlice.reducer;
