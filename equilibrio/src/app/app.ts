import { Component, computed } from '@angular/core';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { ShellComponent } from './components/shell/shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LoginComponent, ShellComponent],
  template: `
    @if (!loggedIn()) {
      <app-login (loggedIn)="onLogin()" />
    } @else {
      <app-shell />
    }
  `,
})
export class AppComponent {
  loggedIn = computed(() => !!this.auth.currentUser());
  constructor(private auth: AuthService) {}
  onLogin() {}
}
