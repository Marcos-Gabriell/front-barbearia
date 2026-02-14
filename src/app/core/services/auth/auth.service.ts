import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

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

export interface ValidateCodePayload {
  email: string;
  code: string;
}

export interface UserData {
  userId: number;
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
    return this.http.post<LoginResponse>(`${this.baseUrl}/refresh`, { refreshToken }).pipe(
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
    if (!token) return true;

    try {
      const payload = this.decodeToken(token);
      if (!payload || !payload.exp) return true;

      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  private decodeToken(token: string): any {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  getUserRole(): string {
    const userData = this.getCurrentUserData();
    return userData?.role || '';
  }

  getUserId(): number | null {
    const userData = this.getCurrentUserData();
    return userData?.userId || null;
  }

  getCurrentUserData(): UserData | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = this.decodeToken(token);
      if (!payload) return null;

      let role = '';
      if (payload.authorities && Array.isArray(payload.authorities)) {
        const authority = payload.authorities[0];
        role = authority.replace('ROLE_', '');
      }

      return {
        userId: payload.userId || payload.sub || payload.id,
        email: payload.email || payload.sub,
        role: role,
        authorities: payload.authorities || [],
        exp: payload.exp,
        iat: payload.iat
      };
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }

  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return roles.includes(userRole);
  }
}