// src/app/core/models/user.model.ts

export type UserRole = 'ADMIN' | 'STAFF' | 'DEV';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  active: boolean;
  photoUrl?: string | null;    // campo principal — retornado pelo backend
  avatarUrl?: string | null;   // alias mantido para compatibilidade
  pendingEmail?: string | null;
  mustChangePassword?: boolean;
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