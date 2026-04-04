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
  cumpleaneros = signal<Cliente[]>([]);
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
      
      // Ordenar por día del mes ignorando el año
      const sorted = (data || []).sort((a, b) => {
        const diaA = parseInt(this.getDia(a.cumpleanos));
        const diaB = parseInt(this.getDia(b.cumpleanos));
        return diaA - diaB;
      });

      this.cumpleaneros.set(sorted);
    } catch (error) {
      console.error('Error cargando cumpleaños:', error);
    } finally {
      this.loading.set(false);
    }
  }

  getDia(fecha: string | null | undefined): string {
    if (!fecha) return '??';
    // Formato esperado: YYYY-MM-DD
    const partes = fecha.split('-');
    const dia = partes[partes.length - 1];
    return dia ? dia.padStart(2, '0') : '??';
  }
}
