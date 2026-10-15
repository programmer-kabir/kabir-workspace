import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchProfitReinvestInstallments = createAsyncThunk(
  "profitReinvestInstallments/fetchProfitReinvestInstallments",
  async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/profit_generator/reinvest/profit_auto_Reinvest_Installments.php`,
      );
      return response.data.data;
    } catch (error) {
      return error;
    }
  },
);
const profitAutoReinvestInstallmentsSlice = createSlice({
  name: "profitReinvestInstallments",
  initialState: {
    isProfitReinvestInstallmentsLoading: false,
    profitReinvestInstallments: [],
    isProfitReinvestInstallmentsError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProfitReinvestInstallments.pending, (state) => {
      state.profitReinvestInstallments = true;
    });
    builder.addCase(
      fetchProfitReinvestInstallments.fulfilled,
      (state, action) => {
        state.isProfitReinvestInstallmentsLoading = false;
        state.profitReinvestInstallments = action.payload;
        state.isProfitReinvestInstallmentsError = null;
      },
    );
    builder.addCase(
      fetchProfitReinvestInstallments.rejected,
      (state, action) => {
        state.isProfitReinvestInstallmentsLoading = false;
        state.profitReinvestInstallments = [];
        state.isProfitReinvestInstallmentsError = action.error.message;
      },
    );
  },
});

export default profitAutoReinvestInstallmentsSlice.reducer;
