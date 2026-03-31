import { Component, computed, signal } from '@angular/core';
import { ClientesService } from '../../services/clientes.service';
import { ServiciosService } from '../../services/servicios.service';
import { FormsModule } from '@angular/forms';
import { Cliente, Servicio } from '../../models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visualizar-usuarios',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './visualizar-usuarios.component.html',
  styleUrl: './visualizar-usuarios.component.css'
})
export class VisualizarUsuariosComponent {
  searchQuery = signal('');
  expandedId = signal<number | null>(null);
  showHistory = signal(false);
  selectedHistory = signal<Servicio[]>([]);
  selectedClientName = signal('');

  clientesList = computed(() => {
    const list = this.svc.clientes();
    const query = this.searchQuery().toLowerCase();

    const filtered = list.filter(c => 
      c.nombre.toLowerCase().includes(query) || 
      (c.apellido?.toLowerCase().includes(query) ?? false) ||
      c.codigo.toLowerCase().includes(query)
    );

    return [...filtered].sort((a, b) => b.id - a.id);
  });

  hasMore = computed(() => this.svc.hasMore());

  constructor(
    private svc: ClientesService,
    private serviciosSvc: ServiciosService
  ) {}

  async loadMore() {
    await this.svc.loadMore();
  }

  toggleExpand(id: number) {
    this.expandedId.update(current => current === id ? null : id);
  }

  viewHistory(c: Cliente) {
    const history = this.serviciosSvc.servicios().filter(s => s.clienteId === c.id);
    this.selectedHistory.set(history.sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora}`).getTime();
      const dateB = new Date(`${b.fecha}T${b.hora}`).getTime();
      return dateB - dateA;
    }));
    this.selectedClientName.set(`${c.nombre} ${c.apellido || ''}`);
    this.showHistory.set(true);
  }

  deleteCliente(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      this.svc.remove(id);
      if (this.expandedId() === id) this.expandedId.set(null);
    }
  }

  getTotalSpent(clienteId: number): number {
    return this.serviciosSvc.servicios()
      .filter(s => s.clienteId === clienteId)
      .reduce((acc, s) => acc + s.monto, 0);
  }

  getServiceCount(clienteId: number): number {
    return this.serviciosSvc.servicios()
      .filter(s => s.clienteId === clienteId).length;
  }
}
