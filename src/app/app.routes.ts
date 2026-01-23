import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard'; 

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },

  {
    path: 'recuperar-senha',
    loadComponent: () =>
      import('./pages/recover-password/recover-password.component').then(m => m.RecoverPasswordComponent),
  },

  {
    path: 'setup-conta',
    loadComponent: () => 
      import('./pages/auth/setup-account.component').then(m => m.SetupAccountComponent),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  
  {
    path: 'usuarios',
    canActivate: [authGuard, roleGuard(['DEV', 'ADMIN'])],
    loadComponent: () =>
      import('./pages/users/users.component').then(m => m.UsersComponent),
  },
  
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/perfil/profile.component').then(m => m.ProfileComponent),
  },

  {
    path: 'forbidden',
    loadComponent: () =>
      import('./pages/forbidden/forbidden.component').then(m => m.ForbiddenComponent),
  },

  {
    path: 'not-found',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },

  { path: '**', redirectTo: 'not-found' },
];