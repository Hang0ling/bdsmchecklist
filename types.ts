export interface ChecklistItem {
  id: string;
  category: string;
  label: string;
}

export enum InterestLevel {
  HardLimit = 0,
  NoInterest = 1,
  Neutral = 2,
  Curious = 3,
  Interested = 4,
  Enthusiastic = 5,
}

export enum RolePreference {
  None = 'none',
  Dominant = 'dom',
  Submissive = 'sub',
  Switch = 'switch',
}

export interface UserResponse {
  tried: boolean;
  rating: number; // 1-5 (if tried)
  interest: InterestLevel | null;
  role: RolePreference | null;
}

export interface AppState {
  responses: Record<string, UserResponse>;
  userName: string;
  partnerName: string;
  date: string;
}