import { Component, signal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loggedIn = output<void>();

  username = signal('');
  password = signal('');
  error = signal('');

  constructor(private auth: AuthService) {}

  async doLogin() {
    const ok = await this.auth.login(this.username(), this.password());
    if (ok) {
      this.loggedIn.emit();
    } else {
      this.error.set('Usuario o contraseña incorrectos.');
    }
  }

  onKey(e: KeyboardEvent) { if (e.key === 'Enter') this.doLogin(); }
}
