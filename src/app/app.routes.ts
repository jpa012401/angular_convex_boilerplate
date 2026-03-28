import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'todos',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./components/auth/login.component').then((m) => m.LoginComponent),
        canActivate: [guestGuard],
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./components/auth/register.component').then((m) => m.RegisterComponent),
        canActivate: [guestGuard],
      },
    ],
  },
  {
    path: 'todos',
    loadComponent: () =>
      import('./pages/todo-page.component').then((m) => m.TodoPageComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'todos',
  },
];
