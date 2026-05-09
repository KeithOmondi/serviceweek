export type UserRole = 'admin' | 'super_admin' | 'dr' | 'court_assistant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  station?: string | null;   // null = no restriction (dr/admin); set for court_assistant
  is_verified: boolean;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Shape returned by POST /auth/court-assistant
export interface CreateCourtAssistantDTO {
  name: string;
  email: string;
  station?: string;           // optional — falls back to DR's own station on the server
}

export interface CreateCourtAssistantResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    email: string;
    role: 'court_assistant';
    station: string | null;
  };
}