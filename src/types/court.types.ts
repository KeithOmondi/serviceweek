export interface Court {
  id: number;
  name: string;
}

export interface CourtState {
  courts: Court[];
  loading: boolean;
  error: string | null;
}