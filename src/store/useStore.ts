import { create } from 'zustand';

export type Role = 'admin' | 'teacher' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  groupId?: string;
  createdAt: number;
}

interface AppState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));
