import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Court, CourtState } from '../../types/court.types';
import api from '../../api/api';
import { AxiosError } from 'axios';

// Define the shape of your API error response if known
interface ApiErrorResponse {
  message: string;
}

const initialState: CourtState = {
  courts: [],
  loading: false,
  error: null,
};

// Async thunk with explicit error typing
export const fetchCourts = createAsyncThunk<
  Court[], // Success return type
  void,    // Argument type (none in this case)
  { rejectValue: string } // Type for rejectWithValue
>('courts/fetchCourts', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get(`/courts/get`);
    return response.data.data;
  } catch (error) {
    // Cast to AxiosError to safely access response data
    const err = error as AxiosError<ApiErrorResponse>;
    
    return rejectWithValue(
      err.response?.data?.message || err.message || 'Failed to fetch courts'
    );
  }
});

const courtSlice = createSlice({
  name: 'courts',
  initialState,
  reducers: {
    clearCourtError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourts.fulfilled, (state, action: PayloadAction<Court[]>) => {
        state.loading = false;
        state.courts = action.payload;
      })
      .addCase(fetchCourts.rejected, (state, action) => {
        state.loading = false;
        // action.payload is now strictly typed as string | undefined
        state.error = action.payload ?? 'An unknown error occurred';
      });
  },
});

export const { clearCourtError } = courtSlice.actions;
export default courtSlice.reducer;