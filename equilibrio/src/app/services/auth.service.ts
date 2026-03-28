import { Injectable, signal } from '@angular/core';
import { Usuario } from '../models';
import { supabase } from '../lib/supabase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<Usuario | null>(null);
  private usersSignal = signal<Usuario[]>([]);

  constructor() {
    this.loadUsers();
  }

  private async loadUsers() {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      this.usersSignal.set(data as Usuario[]);
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
      this.currentUser.set(data as Usuario);
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser.set(null);
  }

  getUsers(): Usuario[] {
    return this.usersSignal();
  }

  async createUser(username: string, password: string, role: 'admin' | 'user'): Promise<boolean> {
    const { data, error } = await supabase
      .from('usuarios_sistema')
      .insert([{ username, password, role }])
      .select();

    if (!error && data) {
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
