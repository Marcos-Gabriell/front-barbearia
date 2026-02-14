export interface CatalogItem {
  id: number;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;

  createdAt?: string;
  updatedAt?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  responsibleUsers?: UserSummary[];
}

export interface UserSummary {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface CreateCatalogRequest {
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  active?: boolean;

  responsibleUserIds: number[];
}

export interface UpdateCatalogRequest {
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  active: boolean;

  responsibleUserIds: number[];
}

export type ApiMessageResponse = { message: string };
