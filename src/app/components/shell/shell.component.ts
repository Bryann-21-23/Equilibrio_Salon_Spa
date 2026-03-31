import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  private router = inject(Router);
  public ns = inject(NotificationService);
  isAdmin   = computed(() => this.auth.isAdmin());
  username  = computed(() => this.auth.currentUser()?.username ?? '');
  roleLabel = computed(() => this.auth.isAdmin() ? 'Administrador' : 'Empleada');

  constructor(public auth: AuthService) {}

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
