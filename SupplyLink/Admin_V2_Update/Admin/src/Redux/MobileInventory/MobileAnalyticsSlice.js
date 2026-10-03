import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchStockMobiles = createAsyncThunk(
  "stockMobiles/fetchStockMobiles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/Inventory/getMobileStocks.php`,
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
        error.response?.data?.message || error.message || "Failed to fetch stock mobiles"
      );
    }
  },
);

const MobileAnalyticsSlice = createSlice({
  name: "stockMobiles",
  initialState: {
    isStockMobilesLoading: false,
    stockMobiles: [],
    isStockMobilesError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchStockMobiles.pending, (state) => {
      state.isStockMobilesLoading = true;
    });
    builder.addCase(fetchStockMobiles.fulfilled, (state, action) => {
      state.isStockMobilesLoading = false;
      state.stockMobiles = Array.isArray(action.payload) ? action.payload : [];
      state.isStockMobilesError = null;
    });
    builder.addCase(fetchStockMobiles.rejected, (state, action) => {
      state.isStockMobilesLoading = false;
      state.stockMobiles = [];
      state.isStockMobilesError = action.payload || action.error.message;
    });
  },
});

export default MobileAnalyticsSlice.reducer;
