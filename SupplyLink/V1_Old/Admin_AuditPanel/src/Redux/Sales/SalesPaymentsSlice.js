import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchSalesPayments = createAsyncThunk(
  "salesPayments/fetchSalesPayments",
  async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEYS}/sales_payments/get_sales_payments.php`,
      );
      return response.data.data;
    } catch (error) {
      return error;
    }
  },
);
const SalesPaymentsSlice = createSlice({
  name: "salesPayments",
  initialState: {
    isLoading: false,
    salesPayments: [],
    isError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSalesPayments.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchSalesPayments.fulfilled, (state, action) => {
      state.isLoading = false;
      state.salesPayments = action.payload;
      state.isError = null;
    });
    builder.addCase(fetchSalesPayments.rejected, (state, action) => {
      state.isLoading = false;
      state.salesPayments = [];
      state.isError = action.error.message;
    });
  },
});

export default SalesPaymentsSlice.reducer;
