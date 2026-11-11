import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchCompanyExpenses = createAsyncThunk(
  "companyExpenses/fetchCompanyExpenses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/company_expenses/company_expenses_get.php`
      );
      return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
const companyExpensesSlice = createSlice({
  name: "companyExpenses",
  initialState: {
    isCompanyExpensesLoading: false,
    companyExpenses: [],
    isCompanyExpensesError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCompanyExpenses.pending, (state) => {
      state.isCompanyExpensesLoading = true;
    });
    builder.addCase(fetchCompanyExpenses.fulfilled, (state, action) => {
      state.isCompanyExpensesLoading = false;
      state.companyExpenses = Array.isArray(action.payload) ? action.payload : [];
      state.isCompanyExpensesError = null;
    });
    builder.addCase(fetchCompanyExpenses.rejected, (state, action) => {
      state.isCompanyExpensesLoading = false;
      state.companyExpenses = [];
      state.isCompanyExpensesError = action.payload || action.error.message;
    });
  },
});

export default companyExpensesSlice.reducer;
