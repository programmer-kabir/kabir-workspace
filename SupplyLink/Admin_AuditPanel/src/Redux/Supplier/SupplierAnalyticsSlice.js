import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchSupplier = createAsyncThunk(
  "suppliers/fetchSupplier",
  async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEYS}/supplier/get_supplier.php`,
      );
      return response.data.data;
    } catch (error) {
      return error;
    }
  },
);
const SupplierAnalyticsSlice = createSlice({
  name: "suppliers",
  initialState: {
    isLoading: false,
    suppliers: [],
    isError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSupplier.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchSupplier.fulfilled, (state, action) => {
      state.isLoading = false;
      state.suppliers = action.payload;
      state.isError = null;
    });
    builder.addCase(fetchSupplier.rejected, (state, action) => {
      state.isLoading = false;
      state.suppliers = [];
      state.isError = action.error.message;
    });
  },
});

export default SupplierAnalyticsSlice.reducer;
