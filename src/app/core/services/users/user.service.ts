import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiResponse, User, UserRequest } from '../../models/user.model';
import { UserSummary } from '../../models/catalog.model';

export interface InviteTokenValidationResponse {
  valid: boolean;
  email: string;
}

export interface CompleteInviteRequest {
  token: string;
  name: string;
  password: string;
}

export interface InviteRequest {
  email: string;
  role: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly BASE_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  validateInviteToken(token: string): Observable<InviteTokenValidationResponse> {
    return this.http.get<InviteTokenValidationResponse>(`${this.BASE_URL}/public/invite/${token}`);
  }

  completeInvite(data: CompleteInviteRequest): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(`${this.BASE_URL}/public/invite/complete`, data)
      .pipe(map(r => r.data));
  }

  invite(data: InviteRequest): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.BASE_URL}/users/invite`, data)
      .pipe(map(() => void 0));
  }

  list(): Observable<User[]> {
    return this.http
      .get<ApiResponse<User[]>>(`${this.BASE_URL}/users`)
      .pipe(map(r => r.data));
  }

  getById(id: number): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.BASE_URL}/users/${id}`)
      .pipe(map(r => r.data));
  }

  create(user: UserRequest): Observable<User> {
    return this.http
      .post<ApiResponse<User>>(`${this.BASE_URL}/users`, user)
      .pipe(map(r => r.data));
  }

  update(id: number, user: UserRequest): Observable<User> {
    return this.http
      .put<ApiResponse<User>>(`${this.BASE_URL}/users/${id}`, user)
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.BASE_URL}/users/${id}`)
      .pipe(map(() => void 0));
  }

  activate(id: number): Observable<User> {
    return this.http
      .patch<ApiResponse<User>>(`${this.BASE_URL}/users/${id}/activate`, {})
      .pipe(map(r => r.data));
  }

  resetPassword(id: number): Observable<{ temporaryPassword: string }> {
    return this.http
      .patch<ApiResponse<{ temporaryPassword: string }>>(
        `${this.BASE_URL}/users/${id}/reset-password`,
        {}
      )
      .pipe(map(r => r.data));
  }

  listStaffForCatalog(): Observable<ApiResponse<UserSummary[]>> {
    return this.http.get<ApiResponse<UserSummary[]>>(`${this.BASE_URL}/admin/services/all-users`);
  }

  getProfile(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.BASE_URL}/users/me`)
      .pipe(map(r => r.data));
  }

  updateProfile(data: Partial<UserRequest>): Observable<User> {
    return this.http
      .put<ApiResponse<User>>(`${this.BASE_URL}/users/me`, data)
      .pipe(map(r => r.data));
  }

  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.BASE_URL}/users/me/change-password`, data)
      .pipe(map(() => void 0));
  }
}