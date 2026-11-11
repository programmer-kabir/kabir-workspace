import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchInstallmentCards = createAsyncThunk(
  "customerInstallmentCards/fetchInstallmentCards",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/customers/get_installment_cards.php`
      );
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
const customerInstallmentCardsSlice = createSlice({
  name: "customerInstallmentCards",
  initialState: {
    isCustomerInstallmentsCardsLoading: false,
    customerInstallmentCards: [],
    isCustomerInstallmentsCardsError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchInstallmentCards.pending, (state) => {
      state.isCustomerInstallmentsCardsLoading = true;
    });
    builder.addCase(fetchInstallmentCards.fulfilled, (state, action) => {
      state.isCustomerInstallmentsCardsLoading = false;
      state.customerInstallmentCards = Array.isArray(action.payload) ? action.payload : [];
      state.isCustomerInstallmentsCardsError = null;
    });
    builder.addCase(fetchInstallmentCards.rejected, (state, action) => {
      state.isCustomerInstallmentsCardsLoading = false;
      state.customerInstallmentCards = [];
      state.isCustomerInstallmentsCardsError = action.payload || action.error.message;
    });
  },
});

export default customerInstallmentCardsSlice.reducer;
