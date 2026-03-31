import { Injectable, signal } from '@angular/core';
import { Cliente } from '../models';
import { supabase } from '../lib/supabase';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  clientes = signal<Cliente[]>([]);
  hasMore = signal<boolean>(true);
  private pageSize = 50;

  constructor() { this.load(); }

  async load(offset: number = 0) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('id', { ascending: false })
      .range(offset, offset + this.pageSize - 1);

    if (!error && data) {
      const newClients = data as Cliente[];
      if (offset === 0) {
        this.clientes.set(newClients);
      } else {
        this.clientes.update(list => [...list, ...newClients]);
      }
      this.hasMore.set(data.length === this.pageSize);
    }
  }

  async loadMore() {
    if (this.hasMore()) {
      await this.load(this.clientes().length);
    }
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = Math.floor(1000 + Math.random() * 9000).toString(); // 4 dígitos
    const letter = chars.charAt(Math.floor(Math.random() * chars.length)); // 1 letra
    return nums + letter;
  }

  async add(c: Omit<Cliente, 'id' | 'codigo'>) {
    let nuevoCodigo = '';
    let isUnique = false;
    let attempts = 0;

    // Intentar generar un código único (máximo 5 intentos)
    while (!isUnique && attempts < 5) {
      const tempCode = this.generateCode();
      const { data: existing } = await supabase
        .from('clientes')
        .select('id')
        .eq('codigo', tempCode)
        .single();
      
      if (!existing) {
        nuevoCodigo = tempCode;
        isUnique = true;
      }
      attempts++;
    }

    // Si falló el generador después de 5 intentos (muy improbable), usamos un fallback temporal
    if (!nuevoCodigo) {
      nuevoCodigo = this.generateCode() + 'X'; 
    }

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
