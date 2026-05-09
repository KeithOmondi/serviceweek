export type OutcomeKey = 'Grant Confirmed' | 'Matter Adjourned' | 'Withdrawn' | 'Dismissed';

export const OUTCOMES: OutcomeKey[] = ['Grant Confirmed', 'Matter Adjourned', 'Withdrawn', 'Dismissed'];

export const STATIONS = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika'];

export const OUTCOME_STYLES: Record<OutcomeKey, { bg: string; color: string }> = {
  'Grant Confirmed':  { bg: '#EAF3DE', color: '#27500A' },
  'Matter Adjourned': { bg: '#FAEEDA', color: '#633806' },
  'Withdrawn':        { bg: '#F1EFE8', color: '#444441' },
  'Dismissed':        { bg: '#FCEBEB', color: '#791F1F' },
};

export const CHART_COLORS = ['#1D9E75', '#BA7517', '#888780', '#E24B4A'];