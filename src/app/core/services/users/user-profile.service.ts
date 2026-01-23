import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  pendingEmail?: string | null;
  role: string;
  active: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  message?: string;
  data: T;
}

export interface ConfirmResponse {
  message: string;
  token?: string;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/users/me';

  getProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>(this.API_URL).pipe(
      map((res) => res.data)
    );
  }

  updateProfile(data: { name: string; email: string; phone?: string }): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(this.API_URL, data);
  }

  confirmEmail(code: string): Observable<ConfirmResponse> {
    return this.http.post<ConfirmResponse>(`${this.API_URL}/confirm-email`, { code });
  }

  changePassword(data: { currentPassword: string; newPassword: string; confirmNewPassword: string }): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.API_URL}/change-password`, data);
  }
}