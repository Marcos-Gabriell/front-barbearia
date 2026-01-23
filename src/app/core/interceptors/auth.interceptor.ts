import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service'; 
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = authService.getAccessToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/refresh')) {
        
        if (isRefreshing) {
          return refreshTokenSubject.pipe(
            filter(token => token != null),
            take(1),
            switchMap(jwt => {
              return next(req.clone({
                setHeaders: { Authorization: `Bearer ${jwt}` }
              }));
            })
          );
        } else {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((newTokens: any) => {
              isRefreshing = false;
              const newToken = newTokens.data.token;
              refreshTokenSubject.next(newToken);
              
              return next(req.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` }
              }));
            }),
            catchError((refreshErr) => {
              isRefreshing = false;
              authService.clearTokens();
              router.navigate(['/login']);
              return throwError(() => refreshErr);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};