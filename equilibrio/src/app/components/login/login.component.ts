import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
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
  private router = inject(Router);
  private auth = inject(AuthService);

  username = signal('');
  password = signal('');
  error = signal('');

  async doLogin() {
    const ok = await this.auth.login(this.username(), this.password());
    if (ok) {
      this.router.navigate(['/']);
    } else {
      this.error.set('Credenciales inválidas.');
    }
  }

  onKey(e: KeyboardEvent) { if (e.key === 'Enter') this.doLogin(); }
}
