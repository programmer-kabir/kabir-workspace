import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchSalesItems = createAsyncThunk(
  "salesItems/fetchSalesItems",
  async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEYS}/sales_items/get_sales_items.php`,
      );
      return response.data.data;
    } catch (error) {
      return error;
    }
  },
);
const SalesItemsSlice = createSlice({
  name: "salesItems",
  initialState: {
    isLoading: false,
    salesItems: [],
    isError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSalesItems.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchSalesItems.fulfilled, (state, action) => {
      state.isLoading = false;
      state.salesItems = action.payload;
      state.isError = null;
    });
    builder.addCase(fetchSalesItems.rejected, (state, action) => {
      state.isLoading = false;
      state.salesItems = [];
      state.isError = action.error.message;
    });
  },
});

export default SalesItemsSlice.reducer;
