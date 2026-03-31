import { Injectable, signal } from '@angular/core';
import { Servicio } from '../models';
import { supabase } from '../lib/supabase';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  servicios = signal<Servicio[]>([]);
  hasMore = signal<boolean>(true);
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

  async load(offset: number = 0) {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .order('id', { ascending: false })
      .range(offset, offset + this.pageSize - 1);

    if (!error && data) {
      const mapped = data.map(s => this.mapServicio(s));
      
      if (offset === 0) {
        this.servicios.set(mapped);
      } else {
        this.servicios.update(list => [...list, ...mapped]);
      }

      this.hasMore.set(data.length === this.pageSize);
    }
  }

  async loadMore() {
    if (this.hasMore()) {
      await this.load(this.servicios().length);
    }
  }

  async add(s: Omit<Servicio, 'id'>) {
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

    if (!error && data) {
      const nuevo = this.mapServicio(data[0]);
      this.servicios.update(list => [nuevo, ...list]);
    }
    return { data, error };
  }

  async remove(id: number) {
    const { error } = await supabase
      .from('servicios')
      .delete()
      .eq('id', id);

    if (!error) {
      this.servicios.update(list => list.filter(s => s.id !== id));
    }
    return { error };
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
