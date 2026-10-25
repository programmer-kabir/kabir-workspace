import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchCashReports = createAsyncThunk(
  "CashReports/fetchCashReports",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/cash/get_cash_report.php`,
      );
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);
const CashReportSlice = createSlice({
  name: "CashReports",
  initialState: {
    isCashReportsLoading: false,
    CashReports: [],
    isCashReportsError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCashReports.pending, (state) => {
      if (!state.CashReports || state.CashReports.length === 0) {
        state.isCashReportsLoading = true;
      }
    });
    builder.addCase(fetchCashReports.fulfilled, (state, action) => {
      state.isCashReportsLoading = false;
      state.CashReports = Array.isArray(action.payload) ? action.payload : [];
      state.isCashReportsError = null;
    });
    builder.addCase(fetchCashReports.rejected, (state, action) => {
      state.isCashReportsLoading = false;
      state.CashReports = [];
      state.isCashReportsError = action.payload || action.error.message;
    });
  },
});

export default CashReportSlice.reducer;
