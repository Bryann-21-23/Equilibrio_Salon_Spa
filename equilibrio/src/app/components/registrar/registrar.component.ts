import { Component, signal, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ServiciosService } from '../../services/servicios.service';
import { ClientesService } from '../../services/clientes.service';
import { Cliente } from '../../models';

const TIPOS = [
  'Corte de cabello','Tinte / Color','Peinado','Manicure',
  'Pedicure','Cejas / Pestañas','Tratamiento capilar','Maquillaje','Otro',
];

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.css',
})
export class RegistrarComponent implements OnInit {
  tipos = TIPOS;
  nombre = signal('');
  selectedCliente = signal<Cliente | null>(null);
  tipo   = signal('');
  monto  = signal<number | null>(null);
  fecha  = signal('');
  hora   = signal('');
  msg    = signal('');
  msgOk  = signal(false);

  showDropdown = signal(false);
  
  sugerencias = computed(() => {
    const q = this.nombre().toLowerCase();
    if (!q || this.selectedCliente()) return [];
    return this.clientesSvc.clientes().filter(c => 
      c.nombre.toLowerCase().includes(q) || (c.apellido?.toLowerCase().includes(q) ?? false)
    ).slice(0, 5);
  });

  constructor(
    private auth: AuthService, 
    private svc: ServiciosService,
    private clientesSvc: ClientesService
  ) {}

  ngOnInit() {
    const now = new Date();
    this.fecha.set(now.toISOString().split('T')[0]);
    this.hora.set(now.toTimeString().slice(0,5));
  }

  selectCliente(c: Cliente) {
    this.selectedCliente.set(c);
    this.nombre.set(`${c.nombre} ${c.apellido || ''}`.trim());
    this.showDropdown.set(false);
  }

  onNombreChange(val: string) {
    this.nombre.set(val);
    if (this.selectedCliente() && val !== `${this.selectedCliente()?.nombre} ${this.selectedCliente()?.apellido || ''}`.trim()) {
      this.selectedCliente.set(null);
    }
    this.showDropdown.set(val.length > 0);
  }

  submit() {
    if (!this.nombre() || !this.tipo() || this.monto() == null || !this.fecha() || !this.hora()) {
      this.msg.set('Completa todos los campos ⚠️'); this.msgOk.set(false); return;
    }
    this.svc.add({
      nombre: this.nombre(), 
      tipo: this.tipo(),
      monto: this.monto()!, 
      fecha: this.fecha(), 
      hora: this.hora(),
      registradoPor: this.auth.currentUser()!.username,
      clienteId: this.selectedCliente()?.id
    });
    this.nombre.set(''); 
    this.tipo.set(''); 
    this.monto.set(null);
    this.selectedCliente.set(null);
    this.msg.set('Servicio registrado ✓'); this.msgOk.set(true);
    setTimeout(() => this.msg.set(''), 2500);
  }
}
