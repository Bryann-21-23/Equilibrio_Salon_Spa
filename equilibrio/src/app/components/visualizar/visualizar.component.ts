import { Component, signal, computed, OnInit, AfterViewInit, ElementRef, ViewChild, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ServiciosService } from '../../services/servicios.service';
import { Servicio, ChartPeriod } from '../../models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const TIPOS = ['Corte de cabello','Tinte / Color','Peinado','Manicure','Pedicure','Cejas / Pestañas','Tratamiento capilar','Maquillaje','Otro'];
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

@Component({
  selector: 'app-visualizar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './visualizar.component.html',
  styleUrl: './visualizar.component.css',
})
export class VisualizarComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  activeTab = signal<'servicios'|'economicos'>('servicios');
  isAdmin = computed(() => this.auth.isAdmin());

  // Filtros servicios
  tipos = TIPOS;
  fNombre = signal(''); fTipo = signal(''); fDesde = signal(''); fHasta = signal('');
  filtrados = signal<Servicio[]>([]);

  // Chart state
  period = signal<ChartPeriod>('mes');
  chartTipo = signal(''); // Nuevo: Filtro para la gráfica
  periods: {key: ChartPeriod, label: string}[] = [
    {key:'dia', label:'Día'},
    {key:'semana', label:'Semana'},
    {key:'mes', label:'Mes'},
    {key:'año', label:'Año'},
  ];

  // Stats servicios
  statsServ = computed(() => {
    const list = this.filtrados();
    const hoy = new Date().toISOString().split('T')[0];
    const mes  = hoy.slice(0,7);
    return {
      total:    list.length,
      clientes: new Set(list.map(s=>s.nombre.toLowerCase())).size,
      mes:      list.filter(s=>s.fecha.startsWith(mes)).length,
      hoy:      list.filter(s=>s.fecha===hoy).length,
    };
  });

  // Stats economicos
  statsEco = computed(() => {
    const list = this.svc.servicios();
    const hoy  = new Date().toISOString().split('T')[0];
    const mes  = hoy.slice(0,7);
    const total   = list.reduce((a,s)=>a+s.monto, 0);
    const mesMonto= list.filter(s=>s.fecha.startsWith(mes)).reduce((a,s)=>a+s.monto,0);
    const prom    = list.length ? total/list.length : 0;
    const byDate: Record<string,number> = {};
    list.forEach(s=>{ byDate[s.fecha]=(byDate[s.fecha]||0)+s.monto; });
    const mejor = Object.entries(byDate).sort((a,b)=>b[1]-a[1])[0];
    return { total, mes: mesMonto, prom, mejor: mejor ? this.fmt(mejor[0]) : '—' };
  });

  rankingTipos = computed(() => {
    const c: Record<string,number> = {};
    this.svc.servicios().forEach(s=>{ c[s.tipo]=(c[s.tipo]||0)+1; });
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,5);
  });

  rankingClientes = computed(() => {
    const c: Record<string,number> = {};
    this.svc.servicios().forEach(s=>{ c[s.nombre.toLowerCase()]=(c[s.nombre.toLowerCase()]||0)+s.monto; });
    return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,5);
  });

  constructor(public auth: AuthService, private svc: ServiciosService) {
    // Re-run chart when period, data or chart filter changes
    effect(() => {
      this.period(); 
      this.svc.servicios();
      this.chartTipo();
      if (this.activeTab() === 'economicos' && this.chart) {
        this.updateChart();
      }
    });
  }

  ngOnInit() { this.applyFilter(); }

  ngAfterViewInit() {}

  switchTab(tab: 'servicios'|'economicos') {
    if (tab === 'economicos' && !this.isAdmin()) return;
    this.activeTab.set(tab);
    if (tab === 'economicos') {
      setTimeout(() => this.initChart(), 50);
    }
  }

  applyFilter() {
    this.filtrados.set(this.svc.filter({
      nombre: this.fNombre(), tipo: this.fTipo(),
      desde: this.fDesde(), hasta: this.fHasta(),
    }));
  }

  clearFilter() {
    this.fNombre.set(''); this.fTipo.set(''); this.fDesde.set(''); this.fHasta.set('');
    this.applyFilter();
  }

  canDelete = computed(() => this.auth.isAdmin());

  delete(id: number) {
    if (!this.auth.isAdmin()) return;
    this.svc.remove(id);
    this.applyFilter();
  }

  sortedFiltrados = computed(() =>
    [...this.filtrados()].sort((a,b)=>(b.fecha+b.hora).localeCompare(a.fecha+a.hora))
  );

  fmt(f: string) {
    if (!f) return '—';
    const [y,m,d] = f.split('-');
    return `${d} ${MESES[+m-1]} ${y}`;
  }

  // ── CHART ──────────────────────────────
  private getChartData(): { labels: string[]; data: number[] } {
    let all = this.svc.servicios();
    
    // Filtramos por servicio si el usuario seleccionó uno
    if (this.chartTipo()) {
      all = all.filter(s => s.tipo === this.chartTipo());
    }

    const p   = this.period();
    const now = new Date();

    if (p === 'dia') {
      const labels: string[] = [];
      const data: number[]   = [];
      for (let h = 0; h < 24; h++) {
        labels.push(`${String(h).padStart(2,'0')}:00`);
        const hoy = now.toISOString().split('T')[0];
        const sum = all.filter(s=>s.fecha===hoy && parseInt(s.hora.split(':')[0])===h)
                       .reduce((a,s)=>a+s.monto,0);
        data.push(sum);
      }
      return { labels, data };
    }

    if (p === 'semana') {
      const labels: string[] = [];
      const data: number[]   = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate()-i);
        const key = d.toISOString().split('T')[0];
        labels.push(`${DIAS[d.getDay()]} ${d.getDate()}`);
        data.push(all.filter(s=>s.fecha===key).reduce((a,s)=>a+s.monto,0));
      }
      return { labels, data };
    }

    if (p === 'mes') {
      const y = now.getFullYear(), m = now.getMonth()+1;
      const days = new Date(y,m,0).getDate();
      const labels: string[] = [];
      const data: number[]   = [];
      for (let d=1; d<=days; d++) {
        const key = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        labels.push(String(d));
        data.push(all.filter(s=>s.fecha===key).reduce((a,s)=>a+s.monto,0));
      }
      return { labels, data };
    }

    // año
    const y = now.getFullYear();
    const labels = MESES;
    const data = Array.from({length:12},(_,i)=>{
      const key = `${y}-${String(i+1).padStart(2,'0')}`;
      return all.filter(s=>s.fecha.startsWith(key)).reduce((a,s)=>a+s.monto,0);
    });
    return { labels, data };
  }

  initChart() {
    if (this.chart) { this.chart.destroy(); this.chart = null; }
    if (!this.chartCanvas) return;
    const { labels, data } = this.getChartData();
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Ingresos (S/.)',
          data,
          backgroundColor: 'rgba(90,158,47,0.18)',
          borderColor: '#5a9e2f',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` S/. ${(ctx.raw as number).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: { grid: { color: '#f0f0f0' }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#888' } },
          y: {
            grid: { color: '#f0f0f0' },
            ticks: {
              font: { family: 'DM Sans', size: 11 }, color: '#888',
              callback: v => `S/.${v}`,
            },
            beginAtZero: true,
          },
        },
      },
    });
  }

  updateChart() {
    if (!this.chart) { this.initChart(); return; }
    const { labels, data } = this.getChartData();
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.update();
  }

  setPeriod(p: ChartPeriod) {
    this.period.set(p);
    this.updateChart();
  }
}
