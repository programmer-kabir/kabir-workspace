import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchProfitReinvestCards = createAsyncThunk(
  "profitReinvestCards/fetchProfitReinvestCards",
  async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/profit_generator/reinvest/profit_auto_Reinvest_Cards.php`,
      );
      return response.data.data;
    } catch (error) {
      return error;
    }
  },
);
const profitAutoReinvestCardsSlice = createSlice({
  name: "profitReinvestCards",
  initialState: {
    isProfitReinvestCardsLoading: false,
    profitReinvestCards: [],
    isProfitReinvestCardsError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProfitReinvestCards.pending, (state) => {
      state.profitReinvestCards = true;
    });
    builder.addCase(fetchProfitReinvestCards.fulfilled, (state, action) => {
      state.isProfitReinvestCardsLoading = false;
      state.profitReinvestCards = action.payload;
      state.isProfitReinvestCardsError = null;
    });
    builder.addCase(fetchProfitReinvestCards.rejected, (state, action) => {
      state.isProfitReinvestCardsLoading = false;
      state.profitReinvestCards = [];
      state.isProfitReinvestCardsError = action.error.message;
    });
  },
});

export default profitAutoReinvestCardsSlice.reducer;
