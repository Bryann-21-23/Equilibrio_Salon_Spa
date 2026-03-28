import { Injectable, signal } from '@angular/core';
import { Cliente } from '../models';
import { supabase } from '../lib/supabase';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  clientes = signal<Cliente[]>([]);

  constructor() { this.load(); }

  async load() {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      this.clientes.set(data as Cliente[]);
    }
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = Math.floor(1000 + Math.random() * 9000).toString(); // 4 dígitos
    const letter = chars.charAt(Math.floor(Math.random() * chars.length)); // 1 letra
    return nums + letter;
  }

  async add(c: Omit<Cliente, 'id' | 'codigo'>) {
    const nuevoCodigo = this.generateCode();
    
    // Limpiamos los datos: si un campo opcional es "", lo pasamos a null para SQL
    const payload = {
      nombre: c.nombre,
      apellido: c.apellido || null,
      cumpleanos: c.cumpleanos || null,
      correo: c.correo || null,
      celular: c.celular || null,
      codigo: nuevoCodigo
    };

    const { data, error } = await supabase
      .from('clientes')
      .insert([payload])
      .select();

    if (error) {
      console.error('Error en Supabase:', error.message);
      return { data: null, error };
    }

    if (data) {
      this.clientes.update(list => [data[0] as Cliente, ...list]);
    }
    return { data, error };
  }

  async remove(id: number) {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (!error) {
      this.clientes.update(list => list.filter(c => c.id !== id));
    }
    return { error };
  }
}
