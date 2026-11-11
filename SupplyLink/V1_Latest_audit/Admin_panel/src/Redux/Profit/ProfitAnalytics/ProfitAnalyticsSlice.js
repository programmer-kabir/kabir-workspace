import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";


export const fetchProfitAnalytics = createAsyncThunk(
  "profitAnalytics/fetchProfitAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const baseURL = `${
        import.meta.env.VITE_LOCALHOST_KEY
      }/profit_generator/get_profrit_generator.php`;

      const limit = 500; // Increased limit for fast batch retrieval

      // 1. Fetch first page to get data + total
      const firstRes = await axios.get(baseURL, { params: { page: 1, limit } });
      const firstPayload = firstRes.data || {};

      if (!firstPayload.success) {
        return rejectWithValue(firstPayload?.message || "Failed to load data");
      }

      const firstChunk = Array.isArray(firstPayload.data) ? firstPayload.data : [];
      const total = Number(firstPayload.total || 0);

      // If all data fit on the first page, return immediately
      if (firstChunk.length >= total || firstChunk.length === 0) {
        return firstChunk;
      }

      // 2. Fetch remaining pages in parallel batches
      const totalPages = Math.min(Math.ceil(total / limit), 50);
      const remainingPages = [];
      for (let p = 2; p <= totalPages; p++) {
        remainingPages.push(p);
      }

      const BATCH_SIZE = 6;
      let remainingResults = [];

      for (let i = 0; i < remainingPages.length; i += BATCH_SIZE) {
        const batch = remainingPages.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map((p) =>
          axios.get(baseURL, { params: { page: p, limit } })
        );
        const batchResponses = await Promise.all(batchPromises);

        for (const res of batchResponses) {
          const chunk = Array.isArray(res.data?.data) ? res.data.data : [];
          remainingResults = remainingResults.concat(chunk);
        }
      }

      return firstChunk.concat(remainingResults);
    } catch (err) {
      return rejectWithValue(err?.message || "Network error");
    }
  }
);
const ProfitAnalyticsSlice = createSlice({
  name: "profitAnalytics",
  initialState: {
    isProfitAnalyticsLoading: false,
    profitAnalytics: [],
    isUProfitAnalyticsError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProfitAnalytics.pending, (state) => {
      state.isProfitAnalyticsLoading = true;
    });
    builder.addCase(fetchProfitAnalytics.fulfilled, (state, action) => {
      state.isProfitAnalyticsLoading = false;
      state.profitAnalytics = action.payload;
      state.isUProfitAnalyticsError = null;
    });
    builder.addCase(fetchProfitAnalytics.rejected, (state, action) => {
      state.isProfitAnalyticsLoading = false;
      state.profitAnalytics = [];
      state.isUProfitAnalyticsError = action.error.message;
    });
  },
});

export default ProfitAnalyticsSlice.reducer;
