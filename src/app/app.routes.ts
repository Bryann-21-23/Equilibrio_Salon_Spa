import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./components/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        loadComponent: () =>
          import('./components/admin/admin.component').then((m) => m.AdminComponent),
        canActivate: [adminGuard],
      },
      {
        path: 'visualizar',
        loadComponent: () =>
          import('./components/visualizar/visualizar.component').then(
            (m) => m.VisualizarComponent
          ),
      },
      {
        path: 'registrar',
        loadComponent: () =>
          import('./components/registrar/registrar.component').then(
            (m) => m.RegistrarComponent
          ),
      },
      {
        path: 'visualizar-usuarios',
        loadComponent: () =>
          import('./components/visualizar-usuarios/visualizar-usuarios.component').then(
            (m) => m.VisualizarUsuariosComponent
          ),
        canActivate: [adminGuard],
      },
      {
        path: 'registrar-usuarios',
        loadComponent: () =>
          import('./components/registrar-usuarios/registrar-usuarios.component').then(
            (m) => m.RegistrarUsuariosComponent
          ),
        canActivate: [adminGuard],
      },
      {
        path: 'cumpleanos',
        loadComponent: () =>
          import('./components/cumpleanos/cumpleanos.component').then(
            (m) => m.CumpleanosComponent
          ),
      },
      { path: '', redirectTo: 'visualizar', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
