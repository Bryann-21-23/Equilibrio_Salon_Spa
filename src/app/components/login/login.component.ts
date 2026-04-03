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
  showPassword = signal(false);
  error = signal('');
  isLoading = signal(false); // Nuevo: Para saber si está cargando

  async doLogin() {
    if (this.isLoading()) return;

    this.error.set('');
    this.isLoading.set(true);

    const res = await this.auth.login(this.username(), this.password());
    
    if (res.ok) {
      this.router.navigate(['/']);
    } else {
      this.error.set(res.msg);
    }
    this.isLoading.set(false);
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onKey(e: KeyboardEvent) { if (e.key === 'Enter') this.doLogin(); }
}
