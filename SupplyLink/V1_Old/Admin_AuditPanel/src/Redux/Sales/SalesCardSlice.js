import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchSalesCards = createAsyncThunk(
  "salesCards/fetchSalesCards",
  async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEYS}/sales_cards/get_sales_cards.php`,
      );
      return response.data.data;
    } catch (error) {
      return error;
    }
  },
);
const SalesCardSlice = createSlice({
  name: "salesCards",
  initialState: {
    isLoading: false,
    salesCards: [],
    isError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSalesCards.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchSalesCards.fulfilled, (state, action) => {
      state.isLoading = false;
      state.salesCards = action.payload;
      state.isError = null;
    });
    builder.addCase(fetchSalesCards.rejected, (state, action) => {
      state.isLoading = false;
      state.salesCards = [];
      state.isError = action.error.message;
    });
  },
});

export default SalesCardSlice.reducer;
