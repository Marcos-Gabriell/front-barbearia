// src/app/core/services/users/user-profile.service.ts
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
  photoUrl?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private http    = inject(HttpClient);
  private readonly BASE = 'https://api.falcaobarbearia.com.br/api/users/me';

  getProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>(this.BASE).pipe(map(r => r.data));
  }

  updateProfile(data: { name: string; email: string; phone?: string; photoUrl?: string | null }): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(this.BASE, data);
  }

  /** Atualiza só a foto — PATCH /api/users/me/photo */
  updatePhoto(photoUrl: string | null): Observable<{ message: string; photoUrl: string }> {
    return this.http.patch<{ message: string; photoUrl: string }>(
      `${this.BASE}/photo`,
      { photoUrl }
    );
  }

  confirmEmail(code: string): Observable<any> {
    return this.http.post(`${this.BASE}/confirm-email`, { code });
  }

  changePassword(data: { currentPassword: string; newPassword: string; confirmNewPassword: string }): Observable<any> {
    return this.http.patch(`${this.BASE}/change-password`, data);
  }
}