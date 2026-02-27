// src/app/core/services/auth/auth.service.ts
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, tap, catchError } from 'rxjs';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  data: {
    token: string;
    refreshToken: string;
  };
};

export interface ForgotPasswordRequest {
  email: string;
}

export interface CompletePasswordResetRequest {
  email: string;
  code: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserData {
  userId: number | string;
  email: string;
  role: string;
  authorities: string[];
  exp: number;
  iat: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private readonly baseUrl = 'http://localhost:8080/api/auth';

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap((response) => {
        this.saveTokens(response.data.token, response.data.refreshToken);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => this.clearTokens()),
      catchError(() => {
        this.clearTokens();
        return of(null);
      })
    );
  }

  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(
        tap((response) => {
          this.saveTokens(response.data.token, response.data.refreshToken);
        })
      );
  }

  requestRecovery(email: string): Observable<any> {
    const payload: ForgotPasswordRequest = { email };
    return this.http.post(`${this.baseUrl}/recovery/request`, payload);
  }

  validateRecoveryCode(email: string, code: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/recovery/validate`, { email, code });
  }

  confirmRecovery(payload: CompletePasswordResetRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/recovery/confirm`, payload);
  }

  saveTokens(accessToken: string, refreshToken: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  clearTokens(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  getAccessToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  private decodeToken(token: string): any {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  getCurrentUserData(): UserData | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const payload = this.decodeToken(token);
    if (!payload) return null;

    const authorities: string[] = Array.isArray(payload.authorities) ? payload.authorities : [];

    // tenta role via authorities[0], depois via payload.role
    const roleFromAuthorities =
      authorities[0]?.startsWith('ROLE_') ? authorities[0].replace('ROLE_', '') : authorities[0];

    const role = (roleFromAuthorities || payload.role || '').toString();

    return {
      userId: payload.userId ?? payload.id ?? payload.sub,
      email: payload.email ?? payload.sub ?? '',
      role,
      authorities,
      exp: payload.exp,
      iat: payload.iat,
    };
  }

  getUserRole(): string {
    return this.getCurrentUserData()?.role || '';
  }

  getUserId(): number | null {
    const v = this.getCurrentUserData()?.userId;
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.getUserRole());
  }
}
