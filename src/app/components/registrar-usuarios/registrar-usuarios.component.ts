import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../services/clientes.service';

@Component({
  selector: 'app-registrar-usuarios',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './registrar-usuarios.component.html',
  styleUrl: './registrar-usuarios.component.css',
})
export class RegistrarUsuariosComponent {
  nombre     = signal('');
  apellido   = signal('');
  cumpleanos = signal('');
  correo     = signal('');
  celular    = signal('');
  msg        = signal('');
  msgOk      = signal(false);

  constructor(private svc: ClientesService) {}

  async submit() {
    if (!this.nombre()) {
      this.msg.set('El nombre es obligatorio ⚠️');
      this.msgOk.set(false);
      return;
    }

    const { error } = await this.svc.add({
      nombre: this.nombre(),
      apellido: this.apellido(),
      cumpleanos: this.cumpleanos(),
      correo: this.correo(),
      celular: this.celular(),
    });

    if (error) {
      this.msg.set('Error al registrar usuario: ' + error.message + ' ❌');
      this.msgOk.set(false);
      return;
    }

    this.clear();
    this.msg.set('Usuario registrado correctamente ✓');
    this.msgOk.set(true);
    setTimeout(() => this.msg.set(''), 3000);
  }

  clear() {
    this.nombre.set('');
    this.apellido.set('');
    this.cumpleanos.set('');
    this.correo.set('');
    this.celular.set('');
  }
}
