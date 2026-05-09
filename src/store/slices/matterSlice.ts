import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import api from '../../api/api';
import type {
  AnalyticsSummary,
  AppealMatter,
  CauseListResult,
  CreateMatterDTO,
  JudgeDailyReturn,
  JudgePeriodSummary,
  Matter,
  OutcomeBreakdown,
  PerStationBreakdown,
  RejectMatterDTO,
  ResubmitMatterDTO,
  RRIMatter,
  SessionType,
  StationBreakdown,
  UncontestedMatter,
  UpdateMatterDTO,
} from '../../types/matter.types';

// ─── API RESPONSE WRAPPERS ────────────────────────────────────────────────────

interface ApiError {
  message: string;
}

interface ListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

// ─── STATE ───────────────────────────────────────────────────────────────────

interface LoadingState {
  uncontested: boolean;
  appeals: boolean;
  rri: boolean;
  summary: boolean;
  analytics: boolean;
  causeList: boolean;
  mutating: boolean;
}

interface MatterState {
  uncontested: UncontestedMatter[];
  appeals: AppealMatter[];
  rri: RRIMatter[];
  selectedUncontested: UncontestedMatter | null;
  selectedAppeal: AppealMatter | null;
  selectedRRI: RRIMatter | null;
  summary: AnalyticsSummary | null;
  outcomeBreakdown: OutcomeBreakdown[] | null;
  stationBreakdown: StationBreakdown[] | null;
  perStationBreakdown: PerStationBreakdown[] | null;
  judgeDailyReturns: JudgeDailyReturn[] | null;
  judgePeriodSummary: JudgePeriodSummary[] | null;
  causeListResult: CauseListResult | null;
  loading: LoadingState;
  error: string | null;
}

const initialState: MatterState = {
  uncontested: [],
  appeals: [],
  rri: [],
  selectedUncontested: null,
  selectedAppeal: null,
  selectedRRI: null,
  summary: null,
  outcomeBreakdown: null,
  stationBreakdown: null,
  perStationBreakdown: null,
  judgeDailyReturns: null,
  judgePeriodSummary: null,
  causeListResult: null,
  loading: {
    uncontested: false,
    appeals: false,
    rri: false,
    summary: false,
    analytics: false,
    causeList: false,
    mutating: false,
  },
  error: null,
};

// ─── HELPER ──────────────────────────────────────────────────────────────────

// ─── HELPER ──────────────────────────────────────────────────────────────────

const rejectMsg = (error: unknown, fallback: string): string => {
  const err = error as AxiosError<ApiError>;
  return err.response?.data?.message ?? fallback;
};


// ─── CREATE ──────────────────────────────────────────────────────────────────

export const createMatter = createAsyncThunk(
  'matters/create',
  async (dto: CreateMatterDTO, { rejectWithValue }) => {
    try {
      const { data } = await api.post<SingleResponse<Matter>>('/matters', dto);
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to create matter'));
    }
  }
);

// ─── UNCONTESTED ─────────────────────────────────────────────────────────────

export const fetchUncontested = createAsyncThunk(
  'matters/fetchUncontested',
  async (
    filters: { station?: string; outcome?: string; status?: string; search?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get<ListResponse<UncontestedMatter>>(
        '/matters/uncontested',
        { params: filters }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch uncontested matters'));
    }
  }
);

export const fetchUncontestedById = createAsyncThunk(
  'matters/fetchUncontestedById',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data } = await api.get<SingleResponse<UncontestedMatter>>(
        `/matters/uncontested/${id}`
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch uncontested matter'));
    }
  }
);

export const updateUncontested = createAsyncThunk(
  'matters/updateUncontested',
  async (
    { id, updates }: { id: number; updates: UpdateMatterDTO },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.patch<SingleResponse<UncontestedMatter>>(
        `/matters/uncontested/${id}`,
        updates
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to update uncontested matter'));
    }
  }
);

export const approveUncontested = createAsyncThunk(
  'matters/approveUncontested',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<SingleResponse<UncontestedMatter>>(
        `/matters/uncontested/${id}/approve`
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to approve uncontested matter'));
    }
  }
);

export const rejectUncontested = createAsyncThunk(
  'matters/rejectUncontested',
  async ({ id, rejection_reason }: Pick<RejectMatterDTO, 'id' | 'rejection_reason'>, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<SingleResponse<UncontestedMatter>>(
        `/matters/uncontested/${id}/reject`,
        { rejection_reason }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to reject uncontested matter'));
    }
  }
);

export const resubmitUncontested = createAsyncThunk(
  'matters/resubmitUncontested',
  async ({ id, updates }: Omit<ResubmitMatterDTO, 'table'>, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<SingleResponse<UncontestedMatter>>(
        `/matters/uncontested/${id}/resubmit`,
        updates
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to resubmit uncontested matter'));
    }
  }
);

export const deleteUncontested = createAsyncThunk(
  'matters/deleteUncontested',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/matters/uncontested/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to delete uncontested matter'));
    }
  }
);

// ─── APPEALS ─────────────────────────────────────────────────────────────────

export const fetchAppeals = createAsyncThunk(
  'matters/fetchAppeals',
  async (
    filters: { station?: string; outcome?: string; status?: string; search?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get<ListResponse<AppealMatter>>(
        '/matters/appeals',
        { params: filters }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch appeals'));
    }
  }
);

export const fetchAppealById = createAsyncThunk(
  'matters/fetchAppealById',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data } = await api.get<SingleResponse<AppealMatter>>(
        `/matters/appeals/${id}`
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch appeal'));
    }
  }
);

export const updateAppeal = createAsyncThunk(
  'matters/updateAppeal',
  async (
    { id, updates }: { id: number; updates: UpdateMatterDTO },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.patch<SingleResponse<AppealMatter>>(
        `/matters/appeals/${id}`,
        updates
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to update appeal'));
    }
  }
);

export const approveAppeal = createAsyncThunk(
  'matters/approveAppeal',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<SingleResponse<AppealMatter>>(
        `/matters/appeals/${id}/approve`
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to approve appeal'));
    }
  }
);

export const rejectAppeal = createAsyncThunk(
  'matters/rejectAppeal',
  async ({ id, rejection_reason }: Pick<RejectMatterDTO, 'id' | 'rejection_reason'>, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<SingleResponse<AppealMatter>>(
        `/matters/appeals/${id}/reject`,
        { rejection_reason }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to reject appeal'));
    }
  }
);

export const resubmitAppeal = createAsyncThunk(
  'matters/resubmitAppeal',
  async ({ id, updates }: Omit<ResubmitMatterDTO, 'table'>, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<SingleResponse<AppealMatter>>(
        `/matters/appeals/${id}/resubmit`,
        updates
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to resubmit appeal'));
    }
  }
);

export const deleteAppeal = createAsyncThunk(
  'matters/deleteAppeal',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/matters/appeals/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to delete appeal'));
    }
  }
);

// ─── RRI ─────────────────────────────────────────────────────────────────────

export const fetchRRIMatters = createAsyncThunk(
  'matters/fetchRRI',
  async (
    filters: {
      station?: string;
      judge?: string;
      outcome?: string;
      status?: string;
      search?: string;
      date?: string;
    } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get<ListResponse<RRIMatter>>(
        '/matters/rri',
        { params: filters }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch RRI matters'));
    }
  }
);

export const fetchRRIMatterById = createAsyncThunk(
  'matters/fetchRRIById',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data } = await api.get<SingleResponse<RRIMatter>>(
        `/matters/rri/${id}`
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch RRI matter'));
    }
  }
);

export const updateRRIMatter = createAsyncThunk(
  'matters/updateRRI',
  async (
    { id, updates }: { id: number; updates: UpdateMatterDTO },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.patch<SingleResponse<RRIMatter>>(
        `/matters/rri/${id}`,
        updates
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to update RRI matter'));
    }
  }
);

export const approveRRIMatter = createAsyncThunk(
  'matters/approveRRI',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<SingleResponse<RRIMatter>>(
        `/matters/rri/${id}/approve`
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to approve RRI matter'));
    }
  }
);

export const rejectRRIMatter = createAsyncThunk(
  'matters/rejectRRI',
  async ({ id, rejection_reason }: Pick<RejectMatterDTO, 'id' | 'rejection_reason'>, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<SingleResponse<RRIMatter>>(
        `/matters/rri/${id}/reject`,
        { rejection_reason }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to reject RRI matter'));
    }
  }
);

export const resubmitRRIMatter = createAsyncThunk(
  'matters/resubmitRRI',
  async ({ id, updates }: Omit<ResubmitMatterDTO, 'table'>, { rejectWithValue }) => {
    try {
      const { data } = await api.patch<SingleResponse<RRIMatter>>(
        `/matters/rri/${id}/resubmit`,
        updates
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to resubmit RRI matter'));
    }
  }
);

export const deleteRRIMatter = createAsyncThunk(
  'matters/deleteRRI',
  async (id: number, { rejectWithValue }) => {
    try {
      await api.delete(`/matters/rri/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to delete RRI matter'));
    }
  }
);

// ─── CAUSE LIST ───────────────────────────────────────────────────────────────

export const checkCauseList = createAsyncThunk(
  'matters/checkCauseList',
  async (
    payload: {
      case_numbers: string[];
      station?: string;
      session_type?: SessionType;
      table?: 'uncontested' | 'appeal';
    },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post<CauseListResult>(
        '/matters/causelist/check',
        payload
      );
      return data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to check cause list'));
    }
  }
);

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

export const fetchSummary = createAsyncThunk(
  'matters/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<SingleResponse<AnalyticsSummary>>(
        '/matters/analytics/summary'
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch summary'));
    }
  }
);

export const fetchOutcomeBreakdown = createAsyncThunk(
  'matters/fetchOutcomeBreakdown',
  async (
    params: { session_type: SessionType; table?: 'uncontested' | 'appeal' },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get<SingleResponse<OutcomeBreakdown[]>>(
        '/matters/analytics/outcomes',
        { params }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch outcome breakdown'));
    }
  }
);

export const fetchStationBreakdown = createAsyncThunk(
  'matters/fetchStationBreakdown',
  async (session_type: SessionType, { rejectWithValue }) => {
    try {
      const { data } = await api.get<SingleResponse<StationBreakdown[]>>(
        '/matters/analytics/stations',
        { params: { session_type } }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch station breakdown'));
    }
  }
);

export const fetchPerStationBreakdown = createAsyncThunk(
  'matters/fetchPerStationBreakdown',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get<SingleResponse<PerStationBreakdown[]>>(
        '/matters/analytics/per-station'
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch per-station breakdown'));
    }
  }
);

export const fetchJudgeDailyReturn = createAsyncThunk(
  'matters/fetchJudgeDailyReturn',
  async (
    params: { date: string; judge?: string; session_type?: SessionType },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get<SingleResponse<JudgeDailyReturn[]>>(
        '/matters/analytics/judge-daily',
        { params }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch judge daily return'));
    }
  }
);

export const fetchJudgePeriodSummary = createAsyncThunk(
  'matters/fetchJudgePeriodSummary',
  async (
    params: { session_type: SessionType; judge?: string; station?: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.get<SingleResponse<JudgePeriodSummary[]>>(
        '/matters/analytics/judge-period',
        { params }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(rejectMsg(error, 'Failed to fetch judge period summary'));
    }
  }
);

// ─── SLICE ───────────────────────────────────────────────────────────────────

const matterSlice = createSlice({
  name: 'matters',
  initialState,
  reducers: {
    clearMatterError: (state) => {
      state.error = null;
    },
    clearSelectedMatters: (state) => {
      state.selectedUncontested = null;
      state.selectedAppeal = null;
      state.selectedRRI = null;
    },
    clearCauseListResult: (state) => {
      state.causeListResult = null;
    },
    clearAnalytics: (state) => {
      state.summary = null;
      state.outcomeBreakdown = null;
      state.stationBreakdown = null;
      state.perStationBreakdown = null;
      state.judgeDailyReturns = null;
      state.judgePeriodSummary = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Create ────────────────────────────────────────────────────────────
      .addCase(createMatter.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(createMatter.fulfilled, (state, action: PayloadAction<Matter>) => {
        state.loading.mutating = false;
        const m = action.payload;
        if (m.session_type === 'rri') {
          state.rri.unshift(m as RRIMatter);
        } else {
          // service_week — pushed into uncontested; appeals are created the
          // same way and the list refetch will sort them correctly
          state.uncontested.unshift(m as UncontestedMatter);
        }
      })
      .addCase(createMatter.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })

      // ── Uncontested ───────────────────────────────────────────────────────
      .addCase(fetchUncontested.pending, (state) => {
        state.loading.uncontested = true;
        state.error = null;
      })
      .addCase(fetchUncontested.fulfilled, (state, action: PayloadAction<UncontestedMatter[]>) => {
        state.loading.uncontested = false;
        state.uncontested = action.payload;
      })
      .addCase(fetchUncontested.rejected, (state, action) => {
        state.loading.uncontested = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(fetchUncontestedById.pending, (state) => {
        state.loading.uncontested = true;
        state.error = null;
      })
      .addCase(fetchUncontestedById.fulfilled, (state, action: PayloadAction<UncontestedMatter>) => {
        state.loading.uncontested = false;
        state.selectedUncontested = action.payload;
      })
      .addCase(fetchUncontestedById.rejected, (state, action) => {
        state.loading.uncontested = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(updateUncontested.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(updateUncontested.fulfilled, (state, action: PayloadAction<UncontestedMatter>) => {
        state.loading.mutating = false;
        const idx = state.uncontested.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.uncontested[idx] = action.payload;
        if (state.selectedUncontested?.id === action.payload.id) {
          state.selectedUncontested = action.payload;
        }
      })
      .addCase(updateUncontested.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(approveUncontested.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(approveUncontested.fulfilled, (state, action: PayloadAction<UncontestedMatter>) => {
        state.loading.mutating = false;
        const idx = state.uncontested.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.uncontested[idx] = action.payload;
        if (state.selectedUncontested?.id === action.payload.id) {
          state.selectedUncontested = action.payload;
        }
      })
      .addCase(approveUncontested.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(rejectUncontested.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(rejectUncontested.fulfilled, (state, action: PayloadAction<UncontestedMatter>) => {
        state.loading.mutating = false;
        const idx = state.uncontested.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.uncontested[idx] = action.payload;
        if (state.selectedUncontested?.id === action.payload.id) {
          state.selectedUncontested = action.payload;
        }
      })
      .addCase(rejectUncontested.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(resubmitUncontested.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(resubmitUncontested.fulfilled, (state, action: PayloadAction<UncontestedMatter>) => {
        state.loading.mutating = false;
        const idx = state.uncontested.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.uncontested[idx] = action.payload;
        if (state.selectedUncontested?.id === action.payload.id) {
          state.selectedUncontested = action.payload;
        }
      })
      .addCase(resubmitUncontested.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(deleteUncontested.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(deleteUncontested.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading.mutating = false;
        state.uncontested = state.uncontested.filter((m) => m.id !== action.payload);
        if (state.selectedUncontested?.id === action.payload) {
          state.selectedUncontested = null;
        }
      })
      .addCase(deleteUncontested.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })

      // ── Appeals ───────────────────────────────────────────────────────────
      .addCase(fetchAppeals.pending, (state) => {
        state.loading.appeals = true;
        state.error = null;
      })
      .addCase(fetchAppeals.fulfilled, (state, action: PayloadAction<AppealMatter[]>) => {
        state.loading.appeals = false;
        state.appeals = action.payload;
      })
      .addCase(fetchAppeals.rejected, (state, action) => {
        state.loading.appeals = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(fetchAppealById.pending, (state) => {
        state.loading.appeals = true;
        state.error = null;
      })
      .addCase(fetchAppealById.fulfilled, (state, action: PayloadAction<AppealMatter>) => {
        state.loading.appeals = false;
        state.selectedAppeal = action.payload;
      })
      .addCase(fetchAppealById.rejected, (state, action) => {
        state.loading.appeals = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(updateAppeal.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(updateAppeal.fulfilled, (state, action: PayloadAction<AppealMatter>) => {
        state.loading.mutating = false;
        const idx = state.appeals.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.appeals[idx] = action.payload;
        if (state.selectedAppeal?.id === action.payload.id) {
          state.selectedAppeal = action.payload;
        }
      })
      .addCase(updateAppeal.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(approveAppeal.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(approveAppeal.fulfilled, (state, action: PayloadAction<AppealMatter>) => {
        state.loading.mutating = false;
        const idx = state.appeals.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.appeals[idx] = action.payload;
        if (state.selectedAppeal?.id === action.payload.id) {
          state.selectedAppeal = action.payload;
        }
      })
      .addCase(approveAppeal.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(rejectAppeal.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(rejectAppeal.fulfilled, (state, action: PayloadAction<AppealMatter>) => {
        state.loading.mutating = false;
        const idx = state.appeals.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.appeals[idx] = action.payload;
        if (state.selectedAppeal?.id === action.payload.id) {
          state.selectedAppeal = action.payload;
        }
      })
      .addCase(rejectAppeal.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(resubmitAppeal.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(resubmitAppeal.fulfilled, (state, action: PayloadAction<AppealMatter>) => {
        state.loading.mutating = false;
        const idx = state.appeals.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.appeals[idx] = action.payload;
        if (state.selectedAppeal?.id === action.payload.id) {
          state.selectedAppeal = action.payload;
        }
      })
      .addCase(resubmitAppeal.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(deleteAppeal.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(deleteAppeal.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading.mutating = false;
        state.appeals = state.appeals.filter((m) => m.id !== action.payload);
        if (state.selectedAppeal?.id === action.payload) {
          state.selectedAppeal = null;
        }
      })
      .addCase(deleteAppeal.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })

      // ── RRI ───────────────────────────────────────────────────────────────
      .addCase(fetchRRIMatters.pending, (state) => {
        state.loading.rri = true;
        state.error = null;
      })
      .addCase(fetchRRIMatters.fulfilled, (state, action: PayloadAction<RRIMatter[]>) => {
        state.loading.rri = false;
        state.rri = action.payload;
      })
      .addCase(fetchRRIMatters.rejected, (state, action) => {
        state.loading.rri = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(fetchRRIMatterById.pending, (state) => {
        state.loading.rri = true;
        state.error = null;
      })
      .addCase(fetchRRIMatterById.fulfilled, (state, action: PayloadAction<RRIMatter>) => {
        state.loading.rri = false;
        state.selectedRRI = action.payload;
      })
      .addCase(fetchRRIMatterById.rejected, (state, action) => {
        state.loading.rri = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(updateRRIMatter.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(updateRRIMatter.fulfilled, (state, action: PayloadAction<RRIMatter>) => {
        state.loading.mutating = false;
        const idx = state.rri.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.rri[idx] = action.payload;
        if (state.selectedRRI?.id === action.payload.id) {
          state.selectedRRI = action.payload;
        }
      })
      .addCase(updateRRIMatter.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(approveRRIMatter.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(approveRRIMatter.fulfilled, (state, action: PayloadAction<RRIMatter>) => {
        state.loading.mutating = false;
        const idx = state.rri.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.rri[idx] = action.payload;
        if (state.selectedRRI?.id === action.payload.id) {
          state.selectedRRI = action.payload;
        }
      })
      .addCase(approveRRIMatter.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(rejectRRIMatter.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(rejectRRIMatter.fulfilled, (state, action: PayloadAction<RRIMatter>) => {
        state.loading.mutating = false;
        const idx = state.rri.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.rri[idx] = action.payload;
        if (state.selectedRRI?.id === action.payload.id) {
          state.selectedRRI = action.payload;
        }
      })
      .addCase(rejectRRIMatter.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(resubmitRRIMatter.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(resubmitRRIMatter.fulfilled, (state, action: PayloadAction<RRIMatter>) => {
        state.loading.mutating = false;
        const idx = state.rri.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.rri[idx] = action.payload;
        if (state.selectedRRI?.id === action.payload.id) {
          state.selectedRRI = action.payload;
        }
      })
      .addCase(resubmitRRIMatter.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(deleteRRIMatter.pending, (state) => {
        state.loading.mutating = true;
        state.error = null;
      })
      .addCase(deleteRRIMatter.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading.mutating = false;
        state.rri = state.rri.filter((m) => m.id !== action.payload);
        if (state.selectedRRI?.id === action.payload) {
          state.selectedRRI = null;
        }
      })
      .addCase(deleteRRIMatter.rejected, (state, action) => {
        state.loading.mutating = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })

      // ── Cause List ────────────────────────────────────────────────────────
      .addCase(checkCauseList.pending, (state) => {
        state.loading.causeList = true;
        state.error = null;
      })
      .addCase(checkCauseList.fulfilled, (state, action: PayloadAction<CauseListResult>) => {
        state.loading.causeList = false;
        state.causeListResult = action.payload;
      })
      .addCase(checkCauseList.rejected, (state, action) => {
        state.loading.causeList = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })

      // ── Analytics ─────────────────────────────────────────────────────────
      .addCase(fetchSummary.pending, (state) => {
        state.loading.summary = true;
        state.error = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action: PayloadAction<AnalyticsSummary>) => {
        state.loading.summary = false;
        state.summary = action.payload;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.loading.summary = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(fetchOutcomeBreakdown.pending, (state) => {
        state.loading.analytics = true;
        state.error = null;
      })
      .addCase(fetchOutcomeBreakdown.fulfilled, (state, action: PayloadAction<OutcomeBreakdown[]>) => {
        state.loading.analytics = false;
        state.outcomeBreakdown = action.payload;
      })
      .addCase(fetchOutcomeBreakdown.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(fetchStationBreakdown.pending, (state) => {
        state.loading.analytics = true;
        state.error = null;
      })
      .addCase(fetchStationBreakdown.fulfilled, (state, action: PayloadAction<StationBreakdown[]>) => {
        state.loading.analytics = false;
        state.stationBreakdown = action.payload;
      })
      .addCase(fetchStationBreakdown.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(fetchPerStationBreakdown.pending, (state) => {
        state.loading.analytics = true;
        state.error = null;
      })
      .addCase(fetchPerStationBreakdown.fulfilled, (state, action: PayloadAction<PerStationBreakdown[]>) => {
        state.loading.analytics = false;
        state.perStationBreakdown = action.payload;
      })
      .addCase(fetchPerStationBreakdown.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(fetchJudgeDailyReturn.pending, (state) => {
        state.loading.analytics = true;
        state.error = null;
      })
      .addCase(fetchJudgeDailyReturn.fulfilled, (state, action: PayloadAction<JudgeDailyReturn[]>) => {
        state.loading.analytics = false;
        state.judgeDailyReturns = action.payload;
      })
      .addCase(fetchJudgeDailyReturn.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      })
      .addCase(fetchJudgePeriodSummary.pending, (state) => {
        state.loading.analytics = true;
        state.error = null;
      })
      .addCase(fetchJudgePeriodSummary.fulfilled, (state, action: PayloadAction<JudgePeriodSummary[]>) => {
        state.loading.analytics = false;
        state.judgePeriodSummary = action.payload;
      })
      .addCase(fetchJudgePeriodSummary.rejected, (state, action) => {
        state.loading.analytics = false;
        state.error = (action.payload as string) ?? action.error.message ?? 'Unknown error';
      });
  },
});

export const {
  clearMatterError,
  clearSelectedMatters,
  clearCauseListResult,
  clearAnalytics,
} = matterSlice.actions;

export default matterSlice.reducer;