import { Component, signal, computed } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { VisualizarComponent } from '../visualizar/visualizar.component';
import { RegistrarComponent } from '../registrar/registrar.component';
import { AdminComponent } from '../admin/admin.component';
import { RegistrarUsuariosComponent } from '../registrar-usuarios/registrar-usuarios.component';
import { VisualizarUsuariosComponent } from '../visualizar-usuarios/visualizar-usuarios.component';

type Tab = 'visualizar' | 'registrar' | 'admin' | 'registrar-usuarios' | 'visualizar-usuarios';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    VisualizarComponent, 
    RegistrarComponent, 
    AdminComponent, 
    RegistrarUsuariosComponent,
    VisualizarUsuariosComponent
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  activeTab = signal<Tab>('visualizar');
  isAdmin   = computed(() => this.auth.isAdmin());
  username  = computed(() => this.auth.currentUser()?.username ?? '');
  roleLabel = computed(() => this.auth.isAdmin() ? 'Administrador' : 'Empleada');

  constructor(public auth: AuthService) {}

  switch(tab: Tab) {
    if (tab === 'admin' && !this.isAdmin()) return;
    this.activeTab.set(tab);
  }

  logout() { this.auth.logout(); }
}
