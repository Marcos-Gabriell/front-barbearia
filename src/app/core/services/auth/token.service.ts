import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type JwtPayload = {
  exp?: number;
  sub?: string;
  role?: string;
  roles?: string[] | string;
  authorities?: string[] | string;
  [key: string]: any;
};

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly ACCESS_KEY = 'barbearia_token';
  private readonly REFRESH_KEY = 'barbearia_refresh_token';
  private readonly LEGACY_KEY = 'token';

  private platformId = inject(PLATFORM_ID);

  setAccess(token: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.ACCESS_KEY, token);
  }

  getAccess(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    return localStorage.getItem(this.ACCESS_KEY) ?? localStorage.getItem(this.LEGACY_KEY);
  }

  setRefresh(token: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.REFRESH_KEY, token);
  }

  getRefresh(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(this.REFRESH_KEY);
  }

  setTokens(access: string, refresh?: string): void {
    this.setAccess(access);
    if (refresh) this.setRefresh(refresh);
  }

  clear(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  clearAll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.LEGACY_KEY);
    this.clear();
  }

  private decodePayload(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');

      const json = atob(padded);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  isExpired(token?: string | null): boolean {
    const t = token ?? this.getAccess();
    if (!t) return true;

    const payload = this.decodePayload(t);
    if (!payload?.exp) return true;

    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec;
  }

  getSubject(token?: string | null): string | null {
    const t = token ?? this.getAccess();
    if (!t) return null;

    const payload = this.decodePayload(t);
    return payload?.sub ?? null;
  }

  getRoles(token?: string | null): string[] {
    const t = token ?? this.getAccess();
    if (!t) return [];

    const payload = this.decodePayload(t);
    const raw = payload?.roles ?? payload?.authorities ?? payload?.role;

    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);

    return String(raw)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }
}
