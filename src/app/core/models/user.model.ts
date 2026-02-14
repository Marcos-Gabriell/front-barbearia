export type UserRole = 'ADMIN' | 'STAFF' | 'DEV';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  pendingEmail?: string | null;
  mustChangePassword?: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserRequest {
  name: string;
  email: string;
  phone?: string;
  role: string;
  password?: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  token?: string;
}