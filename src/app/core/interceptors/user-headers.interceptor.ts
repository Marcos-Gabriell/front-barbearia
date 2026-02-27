import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';

export const userHeadersInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (!req.url.includes('/api/appointments')) return next(req);

  const userId = auth.getUserId();
  const role = auth.getUserRole();

  let headers = req.headers;
  if (userId != null) headers = headers.set('X-User-Id', String(userId));
  if (role) headers = headers.set('X-User-Role', String(role));

  return next(req.clone({ headers }));
};
