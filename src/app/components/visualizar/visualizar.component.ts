import { Component, signal, computed, OnInit, AfterViewInit, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ServiciosService } from '../../services/servicios.service';
import { StatsService } from '../../services/stats.service';
import { Servicio, ChartPeriod } from '../../models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const TIPOS = ['Corte de cabello','Tinte / Color','Peinado','Manicure','Pedicure','Cejas / Pestañas','Tratamiento capilar','Maquillaje','Otro'];
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

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
  private stats = inject(StatsService);

  activeTab = signal<'servicios'|'economicos'>('servicios');
  isAdmin = computed(() => this.auth.isAdmin());

  // Filtros servicios
  tipos = TIPOS;
  fNombre = signal(''); fTipo = signal(''); fDesde = signal(''); fHasta = signal('');
  
  // Chart state
  period = signal<ChartPeriod>('mes');
  chartTipo = signal('');
  periods: {key: ChartPeriod, label: string}[] = [
    {key:'dia', label:'Día'},
    {key:'semana', label:'Semana'},
    {key:'mes', label:'Mes'},
    {key:'año', label:'Año'},
  ];

  // Refactor: Los servicios ahora vienen directamente del servicio con filtrado en servidor
  sortedFiltrados = computed(() =>
    [...this.svc.servicios()].sort((a,b)=>(b.fecha+b.hora).localeCompare(a.fecha+a.hora))
  );

  // Stats delegados al servicio
  statsServ = computed(() => this.stats.statsServ());
  statsEco = computed(() => {
    const raw = this.stats.statsEco();
    return {
      ...raw,
      mejor: raw.mejor ? this.fmt(raw.mejor) : '—'
    };
  });
  rankingTipos = computed(() => this.stats.rankingTipos());
  rankingClientes = computed(() => this.stats.rankingClientes());

  hasMore = computed(() => this.svc.hasMore());
  isLoading = computed(() => this.svc.loading());

  constructor(public auth: AuthService, public svc: ServiciosService) {
    effect(() => {
      this.period(); 
      this.svc.servicios();
      this.chartTipo();
      if (this.activeTab() === 'economicos' && this.chart) {
        this.updateChart();
      }
    });
  }

  async loadMore() {
    const filters = {
      nombre: this.fNombre(),
      tipo: this.fTipo(),
      desde: this.fDesde(),
      hasta: this.fHasta()
    };
    await this.svc.load(this.svc.servicios().length, filters);
  }

  ngOnInit() {}

  ngAfterViewInit() {}

  switchTab(tab: 'servicios'|'economicos') {
    if (tab === 'economicos' && !this.isAdmin()) return;
    this.activeTab.set(tab);
    if (tab === 'economicos') {
      setTimeout(() => this.initChart(), 50);
    }
  }

  async applyFilter() {
    const filters = {
      nombre: this.fNombre(),
      tipo: this.fTipo(),
      desde: this.fDesde(),
      hasta: this.fHasta()
    };
    await this.svc.load(0, filters);
  }

  async clearFilter() {
    this.fNombre.set(''); this.fTipo.set(''); this.fDesde.set(''); this.fHasta.set('');
    await this.svc.load(0);
  }

  canDelete = computed(() => this.auth.isAdmin());

  async delete(id: number) {
    if (!this.auth.isAdmin()) return;
    await this.svc.remove(id);
  }

  fmt(f: string) {
    if (!f) return '—';
    const [y,m,d] = f.split('-');
    return `${d} ${MESES[+m-1]} ${y}`;
  }

  private getChartData(): { labels: string[]; data: number[] } {
    return this.stats.getChartData(this.period(), this.chartTipo());
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
