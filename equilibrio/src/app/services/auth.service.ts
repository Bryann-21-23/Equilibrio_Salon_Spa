import { Injectable, signal, computed } from '@angular/core';
import { Usuario } from '../models';
import { supabase } from '../lib/supabase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<Usuario | null>(null);
  private usersSignal = signal<Usuario[]>([]);
  
  // Exponemos la lista de usuarios como una señal de solo lectura
  allUsers = computed(() => this.usersSignal());

  constructor() {
    this.restoreSession();
    this.loadUsers();
  }

  private restoreSession() {
    const saved = localStorage.getItem('equilibrio_user');
    if (saved) {
      try {
        this.currentUser.set(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('equilibrio_user');
      }
    }
  }

  async loadUsers() {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      this.usersSignal.set(data as Usuario[]);
    } else if (error) {
      console.error('Error cargando usuarios:', error.message);
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (!error && data) {
      const user = data as Usuario;
      this.currentUser.set(user);
      localStorage.setItem('equilibrio_user', JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('equilibrio_user');
  }

  getUsers(): Usuario[] {
    return this.usersSignal();
  }

  async createUser(username: string, password: string, role: 'admin' | 'user'): Promise<boolean> {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .insert([{ username, password, role }])
      .select();

    if (error) {
      console.error('Error al crear usuario:', error.message);
      return false;
    }

    if (data) {
      await this.loadUsers();
      return true;
    }
    return false;
  }

  async deleteUser(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('usuarios_sistema')
      .delete()
      .eq('id', id);

    if (!error) {
      await this.loadUsers();
      return true;
    }
    return false;
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }
}
