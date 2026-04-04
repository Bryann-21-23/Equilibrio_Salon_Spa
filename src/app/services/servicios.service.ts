import { Injectable, signal, inject } from '@angular/core';
import { Servicio } from '../models';
import { supabase } from '../lib/supabase';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  private ns = inject(NotificationService);

  servicios = signal<Servicio[]>([]);
  hasMore = signal<boolean>(true);
  loading = signal<boolean>(false);
  private pageSize = 50;

  constructor() { this.load(); }

  private mapServicio(s: any): Servicio {
    return {
      id: s.id,
      clienteId: s.cliente_id,
      nombre: s.nombre,
      tipo: s.tipo,
      monto: s.monto,
      fecha: s.fecha,
      hora: s.hora,
      registradoPor: s.registrado_por
    };
  }

  async load(offset: number = 0, filters?: { nombre?: string; tipo?: string; desde?: string; hasta?: string }) {
    if (this.loading()) return;
    this.loading.set(true);

    try {
      let query = supabase
        .from('servicios')
        .select('*', { count: 'exact' });

      if (filters) {
        if (filters.nombre) query = query.ilike('nombre', `%${filters.nombre}%`);
        if (filters.tipo)   query = query.eq('tipo', filters.tipo);
        if (filters.desde)  query = query.gte('fecha', filters.desde);
        if (filters.hasta)  query = query.lte('fecha', filters.hasta);
      }

      const { data, error, count } = await query
        .order('id', { ascending: false })
        .range(offset, offset + this.pageSize - 1);

      if (error) throw error;

      if (data) {
        const mapped = data.map(s => this.mapServicio(s));

        if (offset === 0) {
          this.servicios.set(mapped);
        } else {
          this.servicios.update(list => [...list, ...mapped]);
        }

        this.hasMore.set(count ? (offset + data.length < count) : data.length === this.pageSize);
      }
    } catch (err: any) {
      this.ns.error('Error al cargar servicios: ' + (err.message || 'Error desconocido'));
      console.error('Error en load servicios:', err);
    } finally {
      this.loading.set(false);
    }
  }
  async loadMore() {
    if (this.hasMore() && !this.loading()) {
      await this.load(this.servicios().length);
    }
  }

  async add(s: Omit<Servicio, 'id'>) {
    this.loading.set(true);
    try {
      const { data, error } = await supabase
        .from('servicios')
        .insert([{
          cliente_id: s.clienteId,
          nombre: s.nombre,
          tipo: s.tipo,
          monto: s.monto,
          fecha: s.fecha,
          hora: s.hora,
          registrado_por: s.registradoPor
        }])
        .select();

      if (error) throw error;

      if (data) {
        const nuevo = this.mapServicio(data[0]);
        this.servicios.update(list => [nuevo, ...list]);
      }
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    } finally {
      this.loading.set(false);
    }
  }

  async remove(id: number) {
    try {
      const { error } = await supabase
        .from('servicios')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.servicios.update(list => list.filter(s => s.id !== id));
      return { error: null };
    } catch (err: any) {
      this.ns.error('Error al eliminar servicio: ' + err.message);
      return { error: err };
    }
  }


  filter(opts: { nombre?: string; tipo?: string; desde?: string; hasta?: string }): Servicio[] {
    return this.servicios().filter(s => {
      if (opts.nombre && !s.nombre.toLowerCase().includes(opts.nombre.toLowerCase())) return false;
      if (opts.tipo   && s.tipo !== opts.tipo) return false;
      if (opts.desde  && s.fecha < opts.desde) return false;
      if (opts.hasta  && s.fecha > opts.hasta) return false;
      return true;
    });
  }
}
