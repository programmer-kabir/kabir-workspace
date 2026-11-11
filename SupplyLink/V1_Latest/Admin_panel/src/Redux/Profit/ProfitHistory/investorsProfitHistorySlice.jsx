import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchInvestProfitHistory = createAsyncThunk(
  "investProfit/fetchInvestProfitHistory",
  async (_, { rejectWithValue }) => {
    try {
      let url = `${
        import.meta.env.VITE_LOCALHOST_KEY
      }/profit/getAllProfitHistory.php`;
      const response = await axios.get(url);
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const investorsProfitHistorySlice = createSlice({
  name: "investorProfitHistory",
  initialState: {
    isInvestProfitHistoryLoading: false,
    investorProfitHistory: [],
    isInvestProfitHistoryError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchInvestProfitHistory.pending, (state) => {
      state.isInvestProfitHistoryLoading = true;
    });
    builder.addCase(fetchInvestProfitHistory.fulfilled, (state, action) => {
      state.isInvestProfitHistoryLoading = false;
      state.investorProfitHistory = Array.isArray(action.payload) ? action.payload : [];
      state.isInvestProfitHistoryError = null;
    });
    builder.addCase(fetchInvestProfitHistory.rejected, (state, action) => {
      state.isInvestProfitHistoryLoading = false;
      state.investorProfitHistory = [];
      state.isInvestProfitHistoryError = action.payload || action.error.message;
    });
  },
});

export default investorsProfitHistorySlice.reducer;
