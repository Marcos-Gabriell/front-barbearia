import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, User, UserRequest } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  private readonly BASE_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  validateInviteToken(token: string): Observable<{ valid: boolean; email: string }> {
    return this.http.get<{ valid: boolean; email: string }>(`${this.BASE_URL}/public/invite/${token}`);
  }

  completeInvite(data: any): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.BASE_URL}/public/invite/complete`, data)
      .pipe(map(r => r.data));
  }

  invite(data: { email: string; role: string }): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.BASE_URL}/users/invite`, data)
      .pipe(map(r => r.data));
  }

  list(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.BASE_URL}/users`)
      .pipe(map(r => r.data));
  }

  getById(id: number): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.BASE_URL}/users/${id}`)
      .pipe(map(r => r.data));
  }

  create(user: UserRequest): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.BASE_URL}/users`, user)
      .pipe(map(r => r.data));
  }

  update(id: number, user: UserRequest): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.BASE_URL}/users/${id}`, user)
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<any>>(`${this.BASE_URL}/users/${id}`)
      .pipe(map(() => void 0));
  }

  activate(id: number): Observable<User> {
    return this.http.patch<ApiResponse<User>>(`${this.BASE_URL}/users/${id}/activate`, {})
      .pipe(map(r => r.data));
  }

  resetPassword(id: number): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.BASE_URL}/users/${id}/reset-password`, {})
      .pipe(map(r => r.data));
  }

  getProfile(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.BASE_URL}/users/me`) 
      .pipe(map(r => r.data));
  }

  updateProfile(data: Partial<UserRequest>): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.BASE_URL}/users/me`, data)
      .pipe(map(r => r.data));
  }

  changePassword(data: any): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.BASE_URL}/users/me/change-password`, data)
      .pipe(map(r => r.data));
  }
}