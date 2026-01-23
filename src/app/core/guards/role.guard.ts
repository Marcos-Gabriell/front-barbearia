import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../services/users/user.service';
import { ToastService } from '../ui/toast.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (route, state) => {
    const platformId = inject(PLATFORM_ID);
    const authService = inject(AuthService);
    const userService = inject(UserService);
    const toast = inject(ToastService);
    const router = inject(Router);

    if (!isPlatformBrowser(platformId)) return true;

    const token = authService.getAccessToken();
    if (!token) {
      router.navigate(['/login']);
      return false;
    }

    return userService.getProfile().pipe(
      map(user => {
        if (allowedRoles.includes(user.role)) {
          return true;
        }
        toast.error('Acesso negado.');
        router.navigate(['/dashboard']); 
        return false;
      }),
      catchError((err) => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  };
}