import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchInstallmentsCards = createAsyncThunk(
  "investInstallmentCards/fetchInstallmentsCards",
  async (investor_id, { rejectWithValue }) => {
    try {
      const url = investor_id
        ? `${import.meta.env.VITE_LOCALHOST_KEY}/investors/getInvestInstallmentsCards.php?investor_id=${investor_id}`
        : `${import.meta.env.VITE_LOCALHOST_KEY}/investors/getInvestInstallmentsCards.php`;
      const response = await axios.get(url);
      const cards = response.data?.cards || response.data?.data || [];
      return Array.isArray(cards) ? cards : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
const investInstallmentCardsSlice = createSlice({
  name: "investInstallmentCards",
  initialState: {
    isInvestInstallmentsCardsLoading: false,
    investInstallmentCards: [],
    isInvestInstallmentsCardsError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchInstallmentsCards.pending, (state) => {
      state.isInvestInstallmentsCardsLoading = true;
    });
    builder.addCase(fetchInstallmentsCards.fulfilled, (state, action) => {
      state.isInvestInstallmentsCardsLoading = false;
      state.investInstallmentCards = Array.isArray(action.payload) ? action.payload : [];
      state.isInvestInstallmentsCardsError = null;
    });
    builder.addCase(fetchInstallmentsCards.rejected, (state, action) => {
      state.isInvestInstallmentsCardsLoading = false;
      state.investInstallmentCards = [];
      state.isInvestInstallmentsCardsError = action.payload || action.error.message;
    });
  },
});

export default investInstallmentCardsSlice.reducer;
