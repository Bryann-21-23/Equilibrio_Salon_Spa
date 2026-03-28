import { Injectable, signal } from '@angular/core';
import { Servicio } from '../models';
import { supabase } from '../lib/supabase';

@Injectable({ providedIn: 'root' })
export class ServiciosService {
  servicios = signal<Servicio[]>([]);

  constructor() { this.load(); }

  async load() {
    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      // Mapear campos de snake_case (DB) a camelCase (Models) si es necesario
      const mapped = data.map((s: any) => ({
        id: s.id,
        clienteId: s.cliente_id,
        nombre: s.nombre,
        tipo: s.tipo,
        monto: s.monto,
        fecha: s.fecha,
        hora: s.hora,
        registradoPor: s.registrado_por
      }));
      this.servicios.set(mapped as Servicio[]);
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
      const nuevo = {
        id: data[0].id,
        clienteId: data[0].cliente_id,
        nombre: data[0].nombre,
        tipo: data[0].tipo,
        monto: data[0].monto,
        fecha: data[0].fecha,
        hora: data[0].hora,
        registradoPor: data[0].registrado_por
      };
      this.servicios.update(list => [nuevo as Servicio, ...list]);
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
