import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ShellComponent } from './components/shell/shell.component';
import { AdminComponent } from './components/admin/admin.component';
import { VisualizarComponent } from './components/visualizar/visualizar.component';
import { RegistrarComponent } from './components/registrar/registrar.component';
import { VisualizarUsuariosComponent } from './components/visualizar-usuarios/visualizar-usuarios.component';
import { RegistrarUsuariosComponent } from './components/registrar-usuarios/registrar-usuarios.component';
import { CumpleanosComponent } from './components/cumpleanos/cumpleanos.component';
import { authGuard, adminGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'admin', component: AdminComponent, canActivate: [adminGuard] },
      { path: 'visualizar', component: VisualizarComponent },
      { path: 'registrar', component: RegistrarComponent },
      { path: 'visualizar-usuarios', component: VisualizarUsuariosComponent, canActivate: [adminGuard] },
      { path: 'registrar-usuarios', component: RegistrarUsuariosComponent, canActivate: [adminGuard] },
      { path: 'cumpleanos', component: CumpleanosComponent },
      { path: '', redirectTo: 'visualizar', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
