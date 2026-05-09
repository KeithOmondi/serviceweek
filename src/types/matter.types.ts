/**
 * matter.types.ts
 * Frontend type definitions — mirrors the backend's matter.interface.ts exactly.
 */

// ─── SESSION TYPE ─────────────────────────────────────────────────────────────

export type SessionType = 'service_week' | 'rri';

// ─── NATURE ───────────────────────────────────────────────────────────────────

export type ServiceWeekNature =
  | 'Uncontested Confirmation'
  | 'Application for Rectification'
  | 'Succession Appeal'
  | 'Adoption of Succession Mediation File';

export type RRINature =
  | 'Ruling'
  | 'Judgment'
  | 'Mention'
  | 'Hearing'
  | 'Directions';

export type MatterNature = ServiceWeekNature | RRINature;

// ─── APPROVAL STATUS ──────────────────────────────────────────────────────────

export type MatterStatus = 'pending' | 'approved' | 'rejected';

// ─── OUTCOMES ─────────────────────────────────────────────────────────────────

export type MatterOutcome =
  | 'Grant Confirmed'
  | 'Matter Adjourned'
  | 'Withdrawn'
  | 'Dismissed';

// ─── CORE MATTER ──────────────────────────────────────────────────────────────

export interface BaseMatter {
  id: number;
  session_type: SessionType;
  station: string;
  judge: string;
  hearing_date: string;
  court_assistant: string;
  case_number: string;
  citation: string;
  nature: MatterNature;
  activity: string;
  outcome: MatterOutcome;
  next_hearing_date?: string | null;
  remarks?: string | null;
  status: MatterStatus;
  rejection_reason?: string | null;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface UncontestedMatter extends BaseMatter {
  session_type: 'service_week';
  nature: ServiceWeekNature;
}

export interface AppealMatter extends BaseMatter {
  session_type: 'service_week';
  nature: ServiceWeekNature;
}

export interface RRIMatter extends BaseMatter {
  session_type: 'rri';
  nature: RRINature;
  related_matter_id?: number | null;
}

export type Matter = UncontestedMatter | AppealMatter | RRIMatter;

// ─── CREATE DTOs ──────────────────────────────────────────────────────────────

export interface CreateServiceWeekMatterDTO {
  session_type: 'service_week';
  table: 'uncontested' | 'appeal';
  station: string;
  judge: string;
  hearing_date: string;
  court_assistant: string;
  case_number: string;
  citation: string;
  nature: ServiceWeekNature;
  activity: string;
  outcome: MatterOutcome;
  next_hearing_date?: string | null;
  remarks?: string | null;
}

export interface CreateRRIMatterDTO {
  session_type: 'rri';
  station: string;
  judge: string;
  hearing_date: string;
  court_assistant: string;
  case_number: string;
  citation: string;
  nature: RRINature;
  activity: string;
  outcome: MatterOutcome;
  next_hearing_date?: string | null;
  remarks?: string | null;
  related_matter_id?: number | null;
}

export type CreateMatterDTO = CreateServiceWeekMatterDTO | CreateRRIMatterDTO;

export interface UpdateMatterDTO {
  station?: string;
  judge?: string;
  hearing_date?: string;
  court_assistant?: string;
  case_number?: string;
  citation?: string;
  nature?: MatterNature;
  activity?: string;
  outcome?: MatterOutcome;
  next_hearing_date?: string | null;
  remarks?: string | null;
  related_matter_id?: number | null;
}

// ─── APPROVE / REJECT / RESUBMIT DTOs ────────────────────────────────────────

/** Shared table discriminator used by approve, reject, and resubmit thunks */
export type MatterTable = 'uncontested' | 'appeals' | 'rri';

export interface RejectMatterDTO {
  id: number;
  table: MatterTable;
  rejection_reason: string;
}

export interface ResubmitMatterDTO {
  id: number;
  table: MatterTable;
  updates: UpdateMatterDTO;
}

// ─── CAUSE LIST ───────────────────────────────────────────────────────────────

export interface CauseListCheckResult {
  case_number: string;
  entered: boolean;
}

export interface CauseListResult {
  summary: {
    total: number;
    entered: number;
    missing: number;
  };
  data: CauseListCheckResult[];
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  total_uncontested: string;
  total_appeals: string;
  total_rri_matters: string;
  total_confirmed: string;
  total_adjourned: string;
  total_withdrawn: string;
  total_dismissed: string;
  total_stations: string;
  total_judges: string;
}

export interface OutcomeBreakdown {
  outcome: MatterOutcome;
  count: string;
}

export interface StationBreakdown {
  station: string;
  count: string;
}

export interface PerStationBreakdown {
  station: string;
  uncontested_count: string;
  appeal_count: string;
  rri_count: string;
  confirmed: string;
  adjourned: string;
  withdrawn: string;
  dismissed: string;
}

export interface JudgeDailyReturn {
  judge: string;
  hearing_date: string;
  total_matters: string;
  grant_confirmed: string;
  adjourned: string;
  withdrawn: string;
  dismissed: string;
}

export interface JudgePeriodSummary {
  judge: string;
  station: string;
  total_matters: string;
  grant_confirmed: string;
  adjourned: string;
  withdrawn: string;
  dismissed: string;
}