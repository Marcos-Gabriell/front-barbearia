import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import { ToastService } from '../ui/toast.service';

const PUBLIC_ROUTES = ['/login', '/not-found'];

function isPublicUrl(url: string): boolean {
  const clean = url.split('?')[0].split('#')[0];
  return PUBLIC_ROUTES.includes(clean);
}

export const authGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const toast = inject(ToastService);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) return true;
  if (isPublicUrl(state.url)) return true;

  const token = authService.getAccessToken();

  if (!token) {
    router.navigate(['/login']);
    return false;
  }
  return true; 
};