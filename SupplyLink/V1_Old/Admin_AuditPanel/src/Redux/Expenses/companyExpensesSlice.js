import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchCompanyExpenses = createAsyncThunk(
  "companyExpenses/fetchCompanyExpenses",
  async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/company_expenses/company_expenses_get.php`
      );
      return response.data.data;
    } catch (error) {
      return error;
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
      state.companyExpenses = action.payload;
      state.isCompanyExpensesError = null;
    });
    builder.addCase(fetchCompanyExpenses.rejected, (state, action) => {
      state.isCompanyExpensesLoading = false;
      state.companyExpenses = [];
      state.isCompanyExpensesError = action.error.message;
    });
  },
});

export default companyExpensesSlice.reducer;
