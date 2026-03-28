import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ClientesService } from '../../services/clientes.service';
import { ServiciosService } from '../../services/servicios.service';
import { Usuario } from '../../models';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  newUser = signal('');
  newPass = signal('');
  newRole = signal<'admin'|'user'>('user');
  msg     = signal('');
  msgOk   = signal(false);

  users = computed(() => this.auth.getUsers());

  constructor(
    public auth: AuthService,
    private clientesSvc: ClientesService,
    private serviciosSvc: ServiciosService
  ) {}

  async create() {
    if (!this.newUser() || !this.newPass()) {
      this.msg.set('Completa usuario y contraseña ⚠️');
      this.msgOk.set(false);
      return;
    }
    const ok = await this.auth.createUser(this.newUser(), this.newPass(), this.newRole());
    if (!ok) {
      this.msg.set('Error al crear usuario o el usuario ya existe ⚠️');
      this.msgOk.set(false);
      return;
    }
    this.newUser.set('');
    this.newPass.set('');
    this.msg.set('Usuario creado ✓');
    this.msgOk.set(true);
    setTimeout(() => this.msg.set(''), 2500);
  }

  async delete(u: Usuario) {
    if (u.username === this.auth.currentUser()?.username) {
      this.msg.set('No puedes eliminar tu propio usuario.');
      this.msgOk.set(false);
      return;
    }
    if (confirm(`¿Estás seguro de eliminar al usuario ${u.username}?`)) {
      const ok = await this.auth.deleteUser(u.id);
      if (ok) {
        this.msg.set('Usuario eliminado.');
        this.msgOk.set(true);
      } else {
        this.msg.set('Error al eliminar usuario.');
        this.msgOk.set(false);
      }
      setTimeout(() => this.msg.set(''), 2500);
    }
  }

  isSelf(u: Usuario) {
    return u.username === this.auth.currentUser()?.username;
  }

  exportToExcel() {
    const clientes = this.clientesSvc.clientes();
    const servicios = this.serviciosSvc.servicios();
    const personal = this.auth.getUsers();

    const wb = XLSX.utils.book_new();
    
    const wsClientes = XLSX.utils.json_to_sheet(clientes);
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');

    const wsServicios = XLSX.utils.json_to_sheet(servicios);
    XLSX.utils.book_append_sheet(wb, wsServicios, 'Servicios');

    const wsPersonal = XLSX.utils.json_to_sheet(personal);
    XLSX.utils.book_append_sheet(wb, wsPersonal, 'Personal_Sistema');

    const fileName = `Equilibrio_Full_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  exportForAI() {
    const data = {
      clientes: this.clientesSvc.clientes(),
      servicios: this.serviciosSvc.servicios(),
      personal: this.auth.getUsers(),
      fechaExportacion: new Date().toLocaleString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Equilibrio_Complete_Data_${new Date().getTime()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
