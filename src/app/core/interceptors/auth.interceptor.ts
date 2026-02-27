// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

const isPublicRoute = (url: string): boolean => {
  return (
    // Rotas de autenticação
    url.includes('/api/auth/login')    ||
    url.includes('/api/auth/refresh')  ||
    url.includes('/api/auth/recovery') ||
    // Rotas públicas — não exigem token (cancel-info, cancel, slots, etc.)
    url.includes('/public/')
  );
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  // 1) Rotas públicas: passa direto, sem Authorization
  if (isPublicRoute(req.url)) {
    return next(req);
  }

  // 2) Rotas privadas: anexa token se existir
  const token   = authService.getAccessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Só trata 401
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // Sem refresh token → desloga
      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) {
        authService.clearTokens();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      // Já está refreshando → segura e solta com novo token
      if (isRefreshing) {
        return refreshTokenSubject.pipe(
          filter((t): t is string => !!t),
          take(1),
          switchMap((newToken) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` }
            });
            return next(retryReq);
          })
        );
      }

      // Inicia refresh
      isRefreshing = true;
      refreshTokenSubject.next(null);

      return authService.refreshToken().pipe(
        switchMap((resp) => {
          const newToken = resp?.data?.token;

          if (!newToken) {
            isRefreshing = false;
            authService.clearTokens();
            router.navigate(['/login']);
            return throwError(() => error);
          }

          isRefreshing = false;
          refreshTokenSubject.next(newToken);

          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` }
          });
          return next(retryReq);
        }),
        catchError((refreshErr) => {
          isRefreshing = false;
          authService.clearTokens();
          router.navigate(['/login']);
          return throwError(() => refreshErr);
        })
      );
    })
  );
};