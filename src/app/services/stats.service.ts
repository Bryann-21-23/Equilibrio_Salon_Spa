import { Injectable, computed, inject } from '@angular/core';
import { ServiciosService } from './servicios.service';
import { Servicio } from '../models';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private svc = inject(ServiciosService);

  // Estadísticas básicas de servicios
  statsServ = computed(() => {
    const list = this.svc.servicios();
    const hoy = new Date().toISOString().split('T')[0];
    const mes = hoy.slice(0, 7);
    
    return {
      total: list.length,
      clientes: new Set(list.map(s => s.nombre.toLowerCase())).size,
      mes: list.filter(s => s.fecha.startsWith(mes)).length,
      hoy: list.filter(s => s.fecha === hoy).length,
    };
  });

  // Estadísticas económicas (solo para admin)
  statsEco = computed(() => {
    const list = this.svc.servicios();
    const hoy = new Date().toISOString().split('T')[0];
    const mes = hoy.slice(0, 7);
    
    const total = list.reduce((a, s) => a + s.monto, 0);
    const mesMonto = list.filter(s => s.fecha.startsWith(mes)).reduce((a, s) => a + s.monto, 0);
    const prom = list.length ? total / list.length : 0;
    
    const byDate: Record<string, number> = {};
    list.forEach(s => { byDate[s.fecha] = (byDate[s.fecha] || 0) + s.monto; });
    const mejor = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0];
    
    return { 
      total, 
      mes: mesMonto, 
      prom, 
      mejor: mejor ? mejor[0] : null 
    };
  });

  rankingTipos = computed(() => {
    const c: Record<string, number> = {};
    this.svc.servicios().forEach(s => { c[s.tipo] = (c[s.tipo] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5);
  });

  rankingClientes = computed(() => {
    const c: Record<string, number> = {};
    this.svc.servicios().forEach(s => { 
      const name = s.nombre.toLowerCase();
      c[name] = (c[name] || 0) + s.monto; 
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5);
  });

  getChartData(period: 'dia' | 'semana' | 'mes' | 'año', chartTipo: string) {
    let all = this.svc.servicios();
    
    if (chartTipo) {
      all = all.filter(s => s.tipo === chartTipo);
    }

    const now = new Date();
    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

    if (period === 'dia') {
      const labels: string[] = [];
      const data: number[]   = [];
      for (let h = 0; h < 24; h++) {
        labels.push(`${String(h).padStart(2, '0')}:00`);
        const hoy = now.toISOString().split('T')[0];
        const sum = all.filter(s => s.fecha === hoy && parseInt(s.hora.split(':')[0]) === h)
                       .reduce((a, s) => a + s.monto, 0);
        data.push(sum);
      }
      return { labels, data };
    }

    if (period === 'semana') {
      const labels: string[] = [];
      const data: number[]   = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i);
        const key = d.toISOString().split('T')[0];
        labels.push(`${DIAS[d.getDay()]} ${d.getDate()}`);
        data.push(all.filter(s => s.fecha === key).reduce((a, s) => a + s.monto, 0));
      }
      return { labels, data };
    }

    if (period === 'mes') {
      const y = now.getFullYear(), m = now.getMonth() + 1;
      const days = new Date(y, m, 0).getDate();
      const labels: string[] = [];
      const data: number[]   = [];
      for (let d = 1; d <= days; d++) {
        const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        labels.push(String(d));
        data.push(all.filter(s => s.fecha === key).reduce((a, s) => a + s.monto, 0));
      }
      return { labels, data };
    }

    // año
    const y = now.getFullYear();
    const labels = MESES;
    const data = Array.from({ length: 12 }, (_, i) => {
      const key = `${y}-${String(i + 1).padStart(2, '0')}`;
      return all.filter(s => s.fecha.startsWith(key)).reduce((a, s) => a + s.monto, 0);
    });
    return { labels, data };
  }
}
