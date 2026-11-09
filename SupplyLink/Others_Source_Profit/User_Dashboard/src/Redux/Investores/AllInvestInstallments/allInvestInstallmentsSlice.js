import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchAllInvestInstallments = createAsyncThunk(
  "allInvestInstallments/fetchAllInvestInstallments",
  async (_, { rejectWithValue }) => {
    try {
      const baseUrl = `${
        import.meta.env.VITE_LOCALHOST_KEY
      }/investors/getAllInstallments.php`;
      const response = await axios.get(baseUrl);
      const data = response.data?.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
const allInvestInstallmentsSlice = createSlice({
  name: "allInvestInstallments",
  initialState: {
    isAllInvestInstallmentsLoading: false,
    allInvestInstallments: [],
    isAllInvestInstallmentsError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAllInvestInstallments.pending, (state) => {
      state.isAllInvestInstallmentsLoading = true;
    });
    builder.addCase(fetchAllInvestInstallments.fulfilled, (state, action) => {
      state.isAllInvestInstallmentsLoading = false;
      state.allInvestInstallments = Array.isArray(action.payload) ? action.payload : [];
      state.isAllInvestInstallmentsError = null;
    });
    builder.addCase(fetchAllInvestInstallments.rejected, (state, action) => {
      state.isAllInvestInstallmentsLoading = false;
      state.allInvestInstallments = [];
      state.isAllInvestInstallmentsError = action.payload || action.error.message;
    });
  },
});

export default allInvestInstallmentsSlice.reducer;
