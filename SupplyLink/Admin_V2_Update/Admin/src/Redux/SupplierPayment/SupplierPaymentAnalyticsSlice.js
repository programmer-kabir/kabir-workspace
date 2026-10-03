import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchSupplierPayments = createAsyncThunk(
  "supplierPayments/fetchSupplierPayments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/supplierPayments/getSupplierPayments.php`,
      );
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data?.data && typeof response.data.data === "object") {
        return Object.values(response.data.data);
      }
      return [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Failed to fetch supplier payments"
      );
    }
  },
);

const SupplierPaymentAnalyticsSlice = createSlice({
  name: "supplierPayments",
  initialState: {
    isSupplierPaymentsLoading: false,
    supplierPayments: [],
    isSupplierPaymentsError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSupplierPayments.pending, (state) => {
      state.isSupplierPaymentsLoading = true;
    });
    builder.addCase(fetchSupplierPayments.fulfilled, (state, action) => {
      state.isSupplierPaymentsLoading = false;
      state.supplierPayments = Array.isArray(action.payload) ? action.payload : [];
      state.isSupplierPaymentsError = null;
    });
    builder.addCase(fetchSupplierPayments.rejected, (state, action) => {
      state.isSupplierPaymentsLoading = false;
      state.supplierPayments = [];
      state.isSupplierPaymentsError = action.payload || action.error.message;
    });
  },
});

export default SupplierPaymentAnalyticsSlice.reducer;
