import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchCardProfitHistory = createAsyncThunk(
  "profitHistory/fetchCardProfitHistory",
  async () => {
    try {
      const baseUrl = `${
        import.meta.env.VITE_LOCALHOST_KEY
      }/profit/getAllProfitHistory.php`;
      const response = await axios.get(baseUrl);
      return response.data;
    } catch (error) {
      return error;
    }
  }
);

const InvestmentProfitStatusSlice = createSlice({
  name: "profitHistory",
  initialState: {
    isProfitHistoryLoading: false,
    profitHistory: [],
    isProfitHistoryError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCardProfitHistory.pending, (state) => {
      state.isProfitHistoryLoading = true;
      state.isProfitHistoryError = null;
    });
    builder.addCase(fetchCardProfitHistory.fulfilled, (state, action) => {
      state.isProfitHistoryLoading = false;
      // API থেকে যদি {success, data} আসে:
      const payload = action.payload;
      state.profitHistory = payload?.data || [];
      state.isProfitHistoryError = null;
    });
    builder.addCase(fetchCardProfitHistory.rejected, (state, action) => {
      state.isProfitHistoryLoading = false;
      state.profitHistory = [];
      state.isProfitHistoryError =
        action.payload?.message || action.error.message;
    });
  },
});

export default InvestmentProfitStatusSlice.reducer;
