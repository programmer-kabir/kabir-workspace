import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
export const fetchCustomerApplications = createAsyncThunk(
  "customerApplications/fetchCustomerApplications",
  async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/applications/get_customer_applications.php`,
      );
      return response.data.data;
    } catch (error) {
      return error;
    }
  },
);
const customerApplicationFromSlice = createSlice({
  name: "customerApplications",
  initialState: {
    isCustomerApplicationsLoading: false,
    customerApplications: [],
    isCustomerApplicationsError: null,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCustomerApplications.pending, (state) => {
      state.isCustomerApplicationsLoading = true;
    });
    builder.addCase(fetchCustomerApplications.fulfilled, (state, action) => {
      state.isCustomerApplicationsLoading = false;
      state.customerApplications = action.payload;
      state.isCustomerApplicationsError = null;
    });
    builder.addCase(fetchCustomerApplications.rejected, (state, action) => {
      state.isCustomerApplicationsLoading = false;
      state.customerApplications = [];
      state.isCustomerApplicationsError = action.error.message;
    });
  },
});

export default customerApplicationFromSlice.reducer;
