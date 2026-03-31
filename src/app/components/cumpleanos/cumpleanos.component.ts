import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientesService } from '../../services/clientes.service';
import { Cliente } from '../../models';

@Component({
  selector: 'app-cumpleanos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cumpleanos.component.html',
  styleUrl: './cumpleanos.component.css'
})
export class CumpleanosComponent implements OnInit {
  cumpleañeros = signal<Cliente[]>([]);
  loading = signal<boolean>(true);
  mesActual: string = '';

  constructor(private clientesService: ClientesService) {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.mesActual = meses[new Date().getMonth()];
  }

  async ngOnInit() {
    try {
      const data = await this.clientesService.loadCumpleanos();
      this.cumpleañeros.set(data);
    } catch (error) {
      console.error('Error cargando cumpleaños:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getDia(fecha: string | null): string {
    if (!fecha) return '??';
    // La fecha viene en formato YYYY-MM-DD
    const partes = fecha.split('-');
    return partes[2] || '??';
  }
}
